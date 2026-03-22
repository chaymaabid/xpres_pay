import { Controller, Post, Patch, Body } from '@nestjs/common';
import { KycGateway } from './kyc.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'nest-keycloak-connect';
import { KycService } from './kyc.service';

@Public()
@Controller('kyc')
export class KycController {
  constructor(
    private kycService:KycService,
    private prisma:PrismaService
  ) {}

  @Post('init')
  async initSession(@Body() body: { userId: string, mode: string }) {
    return this.kycService.initSession(body);
  }

 @Patch('step')
async updateStep(@Body() body: any) { 
  console.log('📥 RECEIVED FROM MOBILE:', body);

  const { sessionId, step, data } = body;
  this.kycService.handleStep(sessionId,step,data);
}

}