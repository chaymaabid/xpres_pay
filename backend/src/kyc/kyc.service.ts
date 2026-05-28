import { Injectable, Logger } from '@nestjs/common';
import { PrismaService }      from 'src/prisma/prisma.service';
import { KycGateway }         from './kyc.gateway';
import { KycVisionService }   from './kyc.vision';
import { StorageService }     from 'src/storage/storage.service'; 

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private prisma:      PrismaService,
    private kycGateway:  KycGateway,
    private kycVision:   KycVisionService,
    private storage:     StorageService,  
  ) {}

  async initSession(body: { userKeycloackId: string; mode: string }, fingerPrint: string) {
    const user=await this.prisma.user.findUnique({
                        where: {
                        keycloakId: body.userKeycloackId
                        }
                    });
    if (!user) {
            throw new Error("User not found");
        }
    const session = await this.prisma.kycSession.create({
      data: {
        userId:    user.id,
        mode:      body.mode,
        status:    'PENDING',
        expiresAt: new Date(Date.now() + 15 * 60_000),
        deviceFingerprint:fingerPrint,
      },
    });
    this.logger.log(`Session created: ${session.id}`);
    return session;
  }

  async handleStep(sessionId: string, step: number, data: any) {
    if (!sessionId) return { success: false, message: 'sessionId is required' };
     const session = await this.prisma.kycSession.findUnique({ where: { id: sessionId } });
       if (!session) return { success: false, message: 'Session not found' };

    switch (step) {

      case 1: {
        const session = await this.prisma.kycSession.findUnique({
        where: { id: sessionId },
        });
        if (!session) {
          throw new Error('KYC session not found');
        }
        await this.prisma.kycSession.update({
          where: { id: sessionId },
          data:  { status: 'INFO_DONE', fullName: data.fullName, idNumber: data.idNumber },
        });
        this.kycGateway.notifyDesktop(sessionId, 'INFO_DONE', 'Personal info received');
        return { success: true };
      }

      case 2: {
        const { cinImage, fullName, idNumber } = data;
        if (!cinImage || !fullName || !idNumber) {
          return { success: false, message: 'cinImage, fullName and idNumber are required' };
        }

        const cinKey = await this.uploadBase64ToMinio(cinImage, session.userId, 'cin');
        this.logger.log(`CIN uploaded to MinIO: ${cinKey}`);

        const ocr = await this.kycVision.verifyCin(cinImage, fullName, idNumber);
        this.logger.log(`OCR result for ${sessionId}: matched=${ocr.matched}`);

        if (!ocr.matched) {
          await this.prisma.kycSession.update({
            where: { id: sessionId },
            data:  { status: 'OCR_FAILED' },
          });
          this.kycGateway.notifyDesktop(sessionId, 'OCR_FAILED', ocr.detail);
          return { success: false, detail: ocr.detail };
        }

        await this.prisma.kycSession.update({
          where: { id: sessionId },
          data:  { status: 'CIN_DONE', cinImage: cinKey },
        });
        
        this.kycGateway.notifyDesktop(sessionId, 'CIN_DONE', 'CIN verified');
        return { success: true };
      }

      case 3: {
        const { faceImage } = data;
        if (!faceImage) return { success: false, message: 'faceImage is required' };

       
 
        let cinKey: string | null = null;
 
        if (session.mode === 'REAUTH') {
          const profile = await this.prisma.trustProfile.findUnique({
            where: { userId: session.userId },
          });
 
          if (!profile?.cinImg) {
            return {
              success: false,
              message: 'No trusted profile found — please complete full KYC first.',
            };
          }
 
          cinKey = profile.cinImg;
          this.logger.log(`REAUTH: using TrustProfile cinImg for user ${session.userId}`);
 
        } else {
          if (!session.cinImage) {
            return { success: false, message: 'CIN image not found — please restart KYC' };
          }
          cinKey = session.cinImage;
        }
      
        const cinUrl = await this.storage.getSignedFileUrl(cinKey);

        const cinBase64 = await this.downloadUrlToBase64(cinUrl);

        const selfieKey = await this.uploadBase64ToMinio(faceImage, session.userId, 'selfie');
        this.logger.log(`Selfie uploaded to MinIO: ${selfieKey}`);

        const face = await this.kycVision.verifyFace(cinBase64, faceImage);
        this.logger.log(`Face result for ${sessionId}: matched=${face.matched} distance=${face.distance}`);

        if (!face.matched) {
          
          this.kycGateway.notifyDesktop(sessionId, 'FACE_FAILED', face.detail);
          return { success: false, detail: face.detail };
        }

         if (session.mode === 'REAUTH') {
          await this.handleReauthSuccess(session.userId, selfieKey, session.deviceFingerprint);
        } else {
          await this.handleFullKycSuccess(session.userId, cinKey, selfieKey, session.deviceFingerprint, session.idNumber);
        }

        this.kycGateway.notifyDesktop(sessionId, 'SUCCESS', 'KYC complete');
        return { success: true };
      }

      default:
        return { success: false, message: `Unknown step: ${step}` };
    }
  }

  private async handleReauthSuccess(
    userId:      string,
    selfieKey:   string,
    fingerprint: string | null,
  ): Promise<void> {
    const profile = await this.prisma.trustProfile.update({
      where: { userId },
      data:  { faceImg: selfieKey },
    });
 
    this.logger.log(`REAUTH: TrustProfile updated for user ${userId}`);
 
    
    if (fingerprint) {
      await this.upsertTrustedDevice(profile.id, fingerprint);
    }
  }
 

  private async handleFullKycSuccess(
    userId:      string,
    cinKey:      string,
    selfieKey:   string,
    fingerprint: string | null,
    idNumber: string | null,
  ): Promise<void> {
    
    const profile = await this.prisma.trustProfile.upsert({
      where:  { userId },
      create: {
        userId,
        cinImg:      cinKey,
        faceImg:     selfieKey,
        isVerified:  true,
        trustScore:  10.0,
        idNumber: idNumber,
      },
      update: {
        cinImg:      cinKey,
        faceImg:     selfieKey,
        isVerified:  true,
      },
    });
 
    this.logger.log(`FULL KYC: TrustProfile created/updated for user ${userId}`);
 
    if (fingerprint) {
      await this.upsertTrustedDevice(profile.id, fingerprint);
    }
  }
 
  private async upsertTrustedDevice(
    trustProfileId: string,
    fingerprint:    string,
  ): Promise<void> {
    await this.prisma.userDevice.upsert({
      where:  { 
        trustProfileId_deviceFingerprint: {
        trustProfileId: trustProfileId,
        deviceFingerprint: fingerprint,
        },
      },           
      create: {
        deviceFingerprint: fingerprint,
        trustProfileId,
      },
      update: {
        trustProfileId,                  
      },
    });
    this.logger.log(`Device ${fingerprint} registered as trusted under profile ${trustProfileId}`);
  }

  private async uploadBase64ToMinio(
    base64:    string,
    userId: string,
    type:      'cin' | 'selfie',
  ): Promise<string> {
    const raw    = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(raw, 'base64');
    const file: Express.Multer.File = {
      fieldname:    type,
      originalname: `${type}-${userId}.jpg`,
      encoding:     '7bit',
      mimetype:     'image/jpeg',
      buffer,
      size:         buffer.length,
      stream:       null as any,
      destination:  '',
      filename:     '',
      path:         '',
    };
    const result = await this.storage.uploadFile(file, userId, type);
    return result;
  }

  private async downloadUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch CIN from MinIO: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }
}