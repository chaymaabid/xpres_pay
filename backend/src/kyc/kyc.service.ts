import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KycGateway } from './kyc.gateway';
@Injectable()
export class KycService {
    constructor(private prisma:PrismaService,private readonly kycGateway: KycGateway){}
    
    async initSession(body: { userId: string, mode: string }){
        const newSession = await this.prisma.kycSession.create({
            data: {
                userId: body.userId,
                mode: body.mode,
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 15 * 60000), 
            },
        });
        console.log('Session Created in DB:', newSession.id);
        return newSession;
    }
    
    async handleStep(sessionId: string, step: number, data: any){
        if (!sessionId) 
            {
            console.error('❌ PRISMA PREVENTED CRASH: sessionId is undefined');
            return { 
                success: false, 
                message: "sessionId is required but was undefined" 
            };
            }

        let newStatus = "PENDING";
        if (step === 1) newStatus = "INFO_DONE";
        if (step === 2) newStatus = "CIN_DONE";
        if (step === 3) newStatus = "SUCCESS";

        const updatedSession = await this.prisma.kycSession.update({
            where: { id: sessionId }, // Now we are sure sessionId is not undefined
            data: { status: newStatus }
        });

        this.kycGateway.notifyDesktop(sessionId, newStatus, "Progress updated");
            return updatedSession;
      
    }
}
