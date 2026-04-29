import { Controller, Query,Get,Req, Patch, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService){}

    @Get()
    async getNotifications(@Req()req){
        const keycloakId=req.user.sub;
        return this.notificationService.getUserNotifications(keycloakId);
    }
    @Get('unread-count')
    async getUnreadCount(@Req()req){
        const keycloakId=req.user.sub;
        const count=await this.notificationService.getUnreadCount(keycloakId);
        return {count};
    }
    @Patch('read')
    async markAllRead(@Req()req){
        const keycloakId=req.user.sub;
        return this.notificationService.markAllRead(keycloakId);
    }
    @Patch(':id/read')
    async markOneRead(@Req()req, @Param('id') id:string){
        const keycloakId=req.user.sub;
        return this.notificationService.markOneRead(id,keycloakId);
    }
}
