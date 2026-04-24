import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UsersModule } from 'src/users/users.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { TransactionLedgerModule } from 'src/transaction-ledger/transaction-ledger.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  imports: [UsersModule, StripeModule, TransactionLedgerModule, StorageModule,]
})
export class TransactionsModule {}
