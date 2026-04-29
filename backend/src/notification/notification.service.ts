import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationService {
    constructor(private prisma:PrismaService,
                private userService: UsersService,
    ){}

    async create(data:{
        userId:string;
        type:NotificationType;
        title:string;
        message:string;
        url?:string;
    }){
        return this.prisma.notification.create({data});
    }

    async getUserNotifications(keycloakId: string) {
        const user= await this.userService.findByKeycloakId(keycloakId);
        const userId=user?.id;
        const unreadNotifications = await this.prisma.notification.findMany({
            where: {
            userId,
            isRead: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (unreadNotifications.length >= 3) {
            return unreadNotifications;
        }
        const needed = 3 - unreadNotifications.length;
        const extraNotifications = await this.prisma.notification.findMany({
            where: {
                userId,
                isRead: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: needed,
        });
        return [...unreadNotifications, ...extraNotifications];
    }
    async getUnreadCount(keycloakId:string){
        const user= await this.userService.findByKeycloakId(keycloakId);
        const userId=user?.id;
        return this.prisma.notification.count({
            where: {userId,isRead:false},
        });
    }
    async markAllRead(keycloakId:string){
        const user= await this.userService.findByKeycloakId(keycloakId);
        const userId=user?.id;
        return this.prisma.notification.updateMany({
            where:{userId,isRead:false},
            data:{
                isRead:true,
                readedAt:new Date(),
            },
        });
    }
    async markOneRead(notificationId:string, keycloakId:string){
        const user= await this.userService.findByKeycloakId(keycloakId);
        const userId=user?.id;
        return this.prisma.notification.updateMany({
            where:{id:notificationId,userId},
            data:{isRead:true,readedAt: new Date()},
        })
    }
}
