import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderItemDto } from 'src/order-items/dto/create-order-items';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { OrderItemsService } from 'src/order-items/order-items.service';
@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService,
        private usersService: UsersService,
        private productService:ProductsService,
        private orderItemsService: OrderItemsService
    ) {}
    async Order(dto: CreateOrderDto,keycloakId:string) {
    const buyer= await this.usersService.findByKeycloakId(keycloakId);
    if (!buyer) {
            throw new Error("buyer not found");
        }
    return this.prisma.$transaction(async (tx) => {

        ///create OrderItems list from list of products
        let total = 0;
        const orderItems : CreateOrderItemDto [] =[]  ;
        const items=dto.items;
        for (const item of items) {
            const product = await this.productService.findOne(item.productId,tx);
            const price = product.price.toNumber();
            total += price * item.quantity;

            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                unitPriceAtOrder:price,
            });
        }

        // create order
        const order = await tx.order.create({
            data: {
                buyer:{
                    connect:{id:buyer.id}
                },
                totalAmount:total,
                status: dto.status,
                shippingAddress:dto.shippingAddress,
                note: dto.note
            }
        });

        // create all the orderItem related to this order
        await this.orderItemsService.createManyOrderItems(orderItems, order.id,tx)

        await tx.transaction.create({
            data: {
        orderId: order.id,
        amount: total,
        status: "INITIATED"
      }
    });

    return order;
  });

}

    
}
