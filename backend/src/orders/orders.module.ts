import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { OrderItemsModule } from 'src/order-items/order-items.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [UsersModule, ProductsModule, OrderItemsModule]
})
export class OrdersModule {}
