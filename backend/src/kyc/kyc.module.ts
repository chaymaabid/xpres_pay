import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycGateway } from './kyc.gateway';
import { KycService } from './kyc.service';
import { KycVisionService } from './kyc.vision';
import { StorageService } from 'src/storage/storage.service';
import { PrismaModule} from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers:[KycController],
  providers: [KycGateway, KycService, KycVisionService, StorageService], 
})
export class KycModule {}