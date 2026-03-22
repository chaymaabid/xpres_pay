import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycGateway } from './kyc.gateway';
import { KycService } from './kyc.service';

@Module({
  controllers:[KycController],
  providers: [KycGateway, KycService], 
})
export class KycModule {}