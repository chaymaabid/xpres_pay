import { Controller, Post, Patch, Body, Req,HttpCode } from '@nestjs/common';
import { KycGateway } from './kyc.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'nest-keycloak-connect';
import { KycService } from './kyc.service';

@Public()
@Controller('kyc')
export class KycController {
  private logger = { log: (m: string) => console.log(`[KycController] ${m}`) };
  constructor(
    private kycService:KycService,
    private prisma:PrismaService
  ) {}

  @Post('init')
  async initSession(@Body() body: { userKeycloackId: string, mode: string }, @Req() req: Request) {
    const fingerprint = req.headers['x-device-fingerprint'] as string;

  if (!fingerprint) {
    console.warn('⚠️ No fingerprint provided');
  }
    return this.kycService.initSession(body,fingerprint);
  }

 @Patch('step')
  @HttpCode(200)
  async updateStep(@Body() body: { sessionId: string; step: number; kycmode:string ;data: any }) {
    this.logger?.log?.(`📥 step=${body.step} session=${body.sessionId}`);
    return this.kycService.handleStep(body.sessionId, body.step, body.data);
  }

  

}