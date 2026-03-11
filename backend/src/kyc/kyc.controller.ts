import { Controller, Post, Patch, Body } from '@nestjs/common';
import { KycGateway } from './kyc.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'nest-keycloak-connect';

@Public()
@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycGateway: KycGateway,
    private prisma:PrismaService
  ) {}

  @Post('init')
  async initSession(@Body() body: { userId: string, mode: string }) {
    
    const newSession = await this.prisma.kycSession.create({
    data: {
      userId: body.userId,
      mode: body.mode,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
    },
  });
   console.log('Session Created in DB:', newSession.id);
  return newSession;
  }

 @Patch('step')
async updateStep(@Body() body: any) { // Use 'any' temporarily to log the full body
  // 1. Log the body to see exactly what the phone is sending
  console.log('📥 RECEIVED FROM MOBILE:', body);

  const { sessionId, step, data } = body;

  // 2. CRITICAL GUARD: Check if sessionId is valid before calling Prisma
  if (!sessionId) {
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

  try {
    const updatedSession = await this.prisma.kycSession.update({
      where: { id: sessionId }, // Now we are sure sessionId is not undefined
      data: { status: newStatus }
    });

    this.kycGateway.notifyDesktop(sessionId, newStatus, "Progress updated");
    return updatedSession;
  } catch (error) {
    console.error('❌ PRISMA DB ERROR:', error.message);
    return { success: false, message: "Database update failed" };
  }
}
}