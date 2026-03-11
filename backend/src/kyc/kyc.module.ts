import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycGateway } from './kyc.gateway';

@Module({
  controllers:[KycController],
  providers: [KycGateway], 
})
export class KycModule {}