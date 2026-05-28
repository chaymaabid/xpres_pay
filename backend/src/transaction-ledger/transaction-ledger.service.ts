import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowState } from '@prisma/client';

const VALID_TRANSITIONS: Record<EscrowState, EscrowState[]> = {
  INITIATED:  ['LOCKED','BLOCKED'],
  LOCKED:     ['DELIVERED','BLOCKED'],
  DELIVERED:  ['RELEASED','BLOCKED'],
  RELEASED: ['BLOCKED'],
  BLOCKED:['INITIATED','LOCKED','DELIVERED','RELEASED']
};
export type Actor = 'SYSTEM' | 'RETAILER' | 'FARMER' | 'PLATFORM';

@Injectable()
export class TransactionLedgerService {
    constructor(private readonly prisma:PrismaService){}

    private async transition(
        orderId: string,
        expectedCurrent: EscrowState,
        next: EscrowState,
        actorId: string,
        tx?: any,           
    ) {
        const db = tx ?? this.prisma;
 
        // 1. Load the transaction and verify it exists
        const record = await db.transaction.findUnique({
        where: { orderId },
        });
 
        if (!record) {
        throw new NotFoundException(`Transaction for order ${orderId} not found`);
        }
 
        // 2. Validate current state matches what we expect
        if (record.status !== expectedCurrent) {
        throw new BadRequestException(
            `Invalid transition: expected status ${expectedCurrent} but found ${record.status}. ` +
            `Cannot move to ${next}.`,
        );
        }
 
        // 3. Validate the transition is allowed by the state machine
        const allowed = VALID_TRANSITIONS[record.status];
        if (!allowed.includes(next)) {
        throw new BadRequestException(
            `Transition from ${record.status} to ${next} is not permitted.`,
        );
        }
        let amount=0;
        if (next=='LOCKED'||next=='DELIVERED')
          amount=record.totalPaid;
        else
          if (next=='RELEASED')
            amount=record.orderAmount;
        // 4. Write ledger entry + update transaction state atomically
        const execute = async (prisma: any) => {
        await prisma.transactionLedger.create({
        data: {
            transactionId: record.id,
            amount:amount,
            previousStatus: record.status,
            currentStatus: next,
            actorId,
            },
        });
 
        return prisma.transaction.update({
            where: { id: record.id },
            data: { status: next },
        });
        };
 
        // If called from outside a transaction, wrap in one
        return tx ? execute(tx) : this.prisma.$transaction(execute);
    }

    async lock(orderId: string, actorId: string = 'SYSTEM', tx?: any) {
    return this.transition(orderId, EscrowState.INITIATED, EscrowState.LOCKED, actorId, tx);
    }
    async deliver(orderId: string, actorId: string='FARMER', tx?: any) {
    return this.transition(orderId, EscrowState.LOCKED, EscrowState.DELIVERED, actorId, tx);
  }
    async release(orderId: string, actorId: string='PLATFORM' , tx?: any) {
    return this.transition(orderId, EscrowState.DELIVERED, EscrowState.RELEASED, actorId, tx);
  }

  async getHistory(transactionId: string) {
    return this.prisma.transactionLedger.findMany({
      where: { transactionId },
      orderBy: { timestamp: 'asc' },
    });
  }
  async getStatus(orderId: string): Promise<EscrowState> {
    const record = await this.prisma.transaction.findUnique({
      where: { orderId },
      select: { status: true },
    });
    if (!record) throw new NotFoundException(`Transaction for order ${orderId} not found`);
    return record.status;
  }
}
