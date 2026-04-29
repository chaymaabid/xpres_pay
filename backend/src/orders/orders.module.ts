import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { OrderItemsModule } from 'src/order-items/order-items.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { StripeWebhookController } from './stripe-webhooks.controller';
import { TransactionLedgerModule } from 'src/transaction-ledger/transaction-ledger.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [OrdersController, StripeWebhookController],
  providers: [OrdersService],
  imports: [UsersModule, ProductsModule, OrderItemsModule, StripeModule, TransactionLedgerModule, NotificationModule]
})
export class OrdersModule {}
