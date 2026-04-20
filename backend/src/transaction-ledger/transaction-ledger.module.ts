import { Module } from '@nestjs/common';
import { TransactionLedgerService } from './transaction-ledger.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [TransactionLedgerService],
  exports:[TransactionLedgerService],
})
export class TransactionLedgerModule {}
