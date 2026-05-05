import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './users.controller';
import { NotificationModule } from 'src/notification/notification.module';
@Module({
  controllers:[UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}