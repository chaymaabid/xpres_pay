import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-order-items';
@Injectable()
export class OrderItemsService {
    constructor(private prisma: PrismaService){}
    async createManyOrderItems(orderItems :CreateOrderItemDto [],orderId:string, prisma: Prisma.TransactionClient | PrismaService = this.prisma){
        return await prisma.orderItem.createMany({
            data: orderItems.map(i => ({
            ...i,
            orderId: orderId
        }))
        })

    }
}
