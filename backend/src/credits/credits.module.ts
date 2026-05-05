import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports:     [PrismaModule, UsersModule, NotificationModule],
  providers: [CreditsService],
  controllers: [CreditsController],
  exports:     [CreditsService],
})
export class CreditsModule {}
