import { Controller, Post, Req, Headers, Inject } from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
 import type { RawBodyRequest } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { TransactionLedgerService } from 'src/transaction-ledger/transaction-ledger.service';
@Controller('webhooks/stripe')
export class StripeWebhookController {
 
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
    private readonly ledger:TransactionLedgerService) {}
 
  @Post()
  @Public()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;
 
    try {
      // Verify the webhook is genuinely from Stripe
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return { error: 'Invalid signature' };
    }
 
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
 
      // Find the order by paymentIntentId and update both Order + Transaction
      const transaction = await this.prisma.transaction.findFirst({
        where: { paymentIntentId: paymentIntent.id },
      });
 
      if (transaction) {
        await this.prisma.$transaction(async(tsx)=>{
          await this.ledger.lock(transaction.orderId,'SYSTEM',tsx);
          await tsx.order.update({
            where:{id: transaction.orderId},
            data:{status:'paid'}
          })
        });
      }
    }
 
    return { received: true };
  }
}