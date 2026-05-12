import {
  Injectable, BadRequestException,
  NotFoundException, Logger,
  Inject,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateCreditDto } from './dto/credits.dto';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
     @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
  ) {
  }


  // ─────────────────────────────────────────────────────────────────────────
  // STRIPE SETUP — called before the retailer's first offer
  // Returns a SetupIntent clientSecret so the frontend can collect
  // and save the card via Stripe Elements (no card stored on our servers).
  // ─────────────────────────────────────────────────────────────────────────
  async createSetupIntent(keycloakId: string) {
    const retailer = await this.usersService.findByKeycloakId(keycloakId);
    if (!retailer) throw new BadRequestException('Retailer not found');

    // Ensure Stripe Customer exists (created once, reused forever)
    const customerId = await this.ensureStripeCustomer(retailer);

    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      // Allows future off-session charges (retailer not present at charge time)
      usage: 'off_session',
    });

    return { clientSecret: setupIntent.client_secret };
  }

  // Returns the retailer's default saved PaymentMethod (if any)
  // Frontend uses this to decide: show card form OR just show offer form
  async getSavedPaymentMethod(keycloakId: string) {
    const retailer = await this.usersService.findByKeycloakId(keycloakId);
    if (!retailer?.stripeCustomerId) return { paymentMethod: null };

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: retailer.stripeCustomerId,
      type: 'card',
    });

    const pm = paymentMethods.data[0] ?? null;
    if (!pm) return { paymentMethod: null };

    // Return only safe display info — never expose raw card data
    return {
      paymentMethod: {
        id:    pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear:  pm.card?.exp_year,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE CREDIT OFFER
  // Charges the retailer's saved card immediately.
  // Money sits on the platform until farmer responds.
  // ─────────────────────────────────────────────────────────────────────────
  async createCredit(dto: CreateCreditDto, keycloakId: string) {
    const retailer = await this.usersService.findByKeycloakId(keycloakId);
    if (!retailer) throw new BadRequestException('Retailer not found');

    // Must have a saved card before offering
    if (!retailer.stripeCustomerId) {
      throw new BadRequestException(
        'Please add a payment method before offering credit.',
      );
    }

    // Load farmer + trust profile
    const farmer = await this.prisma.user.findUnique({
      where: { id: dto.borrowerId },
      include: { trustProfile: true },
    });
    if (!farmer) throw new NotFoundException('Farmer not found');
    if (farmer.role !== 'FARMER') {
      throw new BadRequestException('Target user is not a farmer');
    }

    // Get retailer's default saved PaymentMethod
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: retailer.stripeCustomerId,
      type: 'card',
    });
    const paymentMethodId = paymentMethods.data[0]?.id;
    if (!paymentMethodId) {
      throw new BadRequestException(
        'No saved payment method found. Please add a card first.',
      );
    }

    // Charge the card immediately
    // off_session: true → charge without cardholder being present
    // confirm: true    → charge in one step (no separate confirm call)
    let paymentIntent: Stripe.PaymentIntent;
    try{
      paymentIntent = await this.stripe.paymentIntents.create({
        amount:           Math.round(dto.amount * 100), // Stripe uses cents
        currency:         'usd',
        customer:         retailer.stripeCustomerId,
        payment_method:   paymentMethodId,
        off_session:      true,
        confirm:          true,
        // No transfer_data → funds stay on platform (escrow) until farmer accepts
        metadata: {
          type:       'credit_offer',
          lenderId:   retailer.id,
          borrowerId: dto.borrowerId,
        },
      });
    } catch (err: any) {
      // Stripe throws a StripeCardError for card-related failures
      // err.code contains the machine-readable reason
      const code    = err?.code as string | undefined;
      const message = this.stripeCardErrorMessage(code);
      this.logger.warn(`PaymentIntent failed for retailer ${retailer.id}: ${code}`);
      throw new BadRequestException(message);
    }
    const credit =await this.prisma.$transaction(async (tx) => {
      let loan = await tx.loan.findFirst({
        where: {
          lenderId: retailer.id,
          borrowerId: farmer.id,
        },
      });
      if (!loan) {
        loan = await tx.loan.create({
          data: {
            lenderId: retailer.id,
            borrowerId: farmer.id,
          },
        });
      }
      const creditOffer = await tx.creditOffer.create({
        data: {
          loanId: loan.id,
          amount:dto.amount,
          note:dto.note,
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
        },
        include: {
          loan: {
            include: {
              borrower: {
                include: {
                  trustProfile: true,
                },
              },
              lender: true,
            },
          },
        },
      });
    return creditOffer;});

    this.logger.log(  `Credit ${credit.id} created — PI ${paymentIntent.id} charged $${dto.amount}`,);
      
    this.notificationService.create(
    {
      userId: farmer.id,
      type: NotificationType.NEW_CREDIT_OFFER,
      title: 'New Credit Offer',
      message: `${retailer.name} offer you $${credit.amount} credit `,
      url: '/farmer/credits',
    }  )
    return credit;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CANCEL CREDIT (retailer)
  // Only PENDING credits can be cancelled.
  // Issues a Stripe refund → money returns to retailer's card.
  // ─────────────────────────────────────────────────────────────────────────
  async cancelCredit(creditId: string, keycloakId: string) {
    const retailer = await this.usersService.findByKeycloakId(keycloakId);
    if (!retailer) throw new BadRequestException('Retailer not found');

    const credit = await this.prisma.creditOffer.findFirst({
      where: { id: creditId,loan:{lenderId:retailer.id}, status: 'PENDING' },
    });
    if (!credit) {
      throw new NotFoundException(
        'Credit not found, not PENDING, or does not belong to you.',
      );
    }

    // Issue full refund on the original PaymentIntent
    const refund = await this.stripe.refunds.create({
      payment_intent: credit.paymentIntentId!,
    });

    await this.prisma.creditOffer.update({
      where: { id: creditId },
      data: {
        status:      'CANCELLED',
        refundId:    refund.id,
        cancelledBy: retailer.id,
        respondedAt: new Date(),
      },
    });

    this.logger.log(`Credit ${creditId} cancelled — refund ${refund.id}`);
    return { success: true, refundId: refund.id };
  }

  async acceptCredit(creditId: string, keycloakId: string) {
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');
    if (!farmer.stripeAccountId) {
      throw new BadRequestException('Complete Stripe onboarding first.');
    }

    const credit = await this.prisma.creditOffer.findFirst({
      where: { id: creditId,loan:{borrowerId:farmer.id} , status: 'PENDING' },
    });
    if (!credit) throw new NotFoundException('Credit not found or not PENDING.');

    const transfer = await this.stripe.transfers.create({
      amount:      Math.round(Number(credit.amount) * 100),
      currency:    'usd',
      destination: farmer.stripeAccountId,
      metadata:    { creditId },
    });
    const loan=await this.prisma.$transaction(async(tx)=>{
      await this.prisma.creditOffer.update({
        where: {id:creditId},
        data:{
          status:'ACCEPTED',
          transferId:transfer.id,
          respondedAt:new Date(),
        },
      });
      return await this.prisma.loan.update({
        where:{id:credit.loanId},
        data:{
          totalCredit: {increment: credit.amount,},
        }
      })
    });
    
    this.notificationService.create(
    {
      userId: loan.lenderId,
      type: NotificationType.CREDIT_OFFER_ACCEPTED,
      title: 'Credit Offer Acccepted',
      message: `${farmer.name} accept your credit offer of $${credit.amount} `,
      url: '/retailer/credits/my-offers',
    })

    this.logger.log(`Credit ${creditId} accepted — transfer ${transfer.id}`);
    return { success: true, transferId: transfer.id };
  }

  async rejectCredit(creditId: string, keycloakId: string) {
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');

    const credit = await this.prisma.creditOffer.findFirst({
      where: { id: creditId, loan: { borrowerId: farmer.id,}, status: 'PENDING' },
      include: { loan: true,},
    });
    if (!credit) throw new NotFoundException('Credit not found or not PENDING.');

    const refund = await this.stripe.refunds.create({
      payment_intent: credit.paymentIntentId!,
    });

    await this.prisma.creditOffer.update({
      where: { id: creditId },
      data: {
        status:      'REJECTED',
        refundId:    refund.id,
        respondedAt: new Date(),
      },
    });
    this.notificationService.create(
    {
      userId: credit.loan.lenderId,
      type: NotificationType.CREDIT_OFFER_REJECTED,
      title: 'Credit Offer Rejected',
      message: `${farmer.name} reject your credit offer of $${credit.amount} `,
      url: '/retailer/credits/my-offers',
    })
    return { success: true, refundId: refund.id };
  }

  async getRetailerCredits(keycloakId: string) {
    const retailer = await this.usersService.findByKeycloakId(keycloakId);
    if (!retailer) throw new BadRequestException('Retailer not found');
    const credits = await this.prisma.creditOffer.findMany({
    where: {
      loan: {
        lenderId: retailer.id,
      },
    },
    include: {
      loan: {
        include: {
          borrower: {
            include: {
              trustProfile: true,
            },
          },
          lender: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedCredits = credits.map((credit) => ({
    id: credit.id,
    amount: Number(credit.amount),
    status: credit.status,
    note: credit.note,
    createdAt: credit.createdAt,
    respondedAt: credit.respondedAt,
    paymentIntentId: credit.paymentIntentId,
    borrower: {
      id: credit.loan.borrower.id,
      name: credit.loan.borrower.name,
      email: credit.loan.borrower.email,
      trustProfile: credit.loan.borrower.trustProfile
        ? {
            score: credit.loan.borrower.trustProfile.trustScore,
          }
        : 0,
    },
    lender: {
      id: credit.loan.lender.id,
      name: credit.loan.lender.name,
      email: credit.loan.lender.email,
    },
  }));
  const acceptedCredits = credits.filter(
    (c) => c.status === 'ACCEPTED'
  );
  const totalReserved = acceptedCredits.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );
  const acceptanceRate =
    credits.length === 0
      ? 0
      : (acceptedCredits.length / credits.length) * 100;
  const activeFarmers = new Set(
    acceptedCredits.map((c) => c.loan.borrowerId)
  ).size;
  const borrowerScores = acceptedCredits
    .map((c) => c.loan.borrower.trustProfile?.trustScore)
    .filter((score): score is number => score !== undefined);
  const avgScore =
    borrowerScores.length === 0
      ? 0
      : borrowerScores.reduce((a, b) => a + b, 0) /
        borrowerScores.length;

  return {
    credits: formattedCredits,
    stats: { totalReserved,acceptanceRate,activeFarmers,avgScore,},
  };
}

  async getFarmerAllCredits(keycloakId: string) {
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');
 
    const credits = await this.prisma.creditOffer.findMany({
      where:   { loan:{borrowerId:farmer.id} },
      include: { loan: {
                  include: {
                    lender: { include: { trustProfile: true,},},
                    borrower: true,
                  }, },
      },
      orderBy: { createdAt: 'desc' },
    });
 
    const totalOffered  = credits.reduce((s, c) => s + Number(c.amount), 0);
    const totalPending  = credits.filter(c => c.status === 'PENDING').reduce((s, c) => s + Number(c.amount), 0);
    const totalAccepted = credits.filter(c => c.status === 'ACCEPTED').reduce((s, c) => s + Number(c.amount), 0);
    const totalRejected = credits.filter(c => c.status === 'REJECTED').reduce((s, c) => s + Number(c.amount), 0);
    return {
      credits,
      stats: { totalOffered, totalPending, totalAccepted, totalRejected },
    };
  }
 
  async getMarketplace(keycloakId: string) {
    const retailer = await this.usersService.findByKeycloakId(keycloakId);
    if (!retailer) throw new BadRequestException('Retailer not found');

    const farmers = await this.prisma.user.findMany({
      where: { role: 'FARMER' },
      select: {
        id: true,
        name: true,
        email: true,
        stripeAccountId: true,
        trustProfile: { select: { trustScore: true } },
        products: {
          select: {
            orderItems: {
              select: { order: { select: {  id:true, 
                                            status: true,
                                            totalAmount: true, 
                                            transaction:true,
                                          },},
            },
          },
        },
        },
      },
      orderBy: { trustProfile: { trustScore: 'desc' } },
    });

    return farmers.map(farmer => {
      const score = farmer.trustProfile?.trustScore ?? 0;
      const ordersMap = new Map<string, number>();
      farmer.products.forEach(product => {
        product.orderItems.forEach(item => {
        const order = item.order;
        if (order.transaction?.status !== 'RELEASED') return;
        if (!ordersMap.has(order.id)) {
          ordersMap.set(order.id, Number(order.totalAmount));
        }
        });
      });
      const orderCount = ordersMap.size;
      const totalSales = Array.from(ordersMap.values()).reduce((sum, val) => sum + val, 0);

      return {
        id:              farmer.id,
        name:            farmer.name,
        email:           farmer.email,
        hasStripeAccount: !!farmer.stripeAccountId,
        score,
        totalSales,
        orderCount,
      };
    });
  }

    // ─────────────────────────────────────────────────────────────────────────
  // READ — FARMER: their pending credit offers
  // ─────────────────────────────────────────────────────────────────────────
  async getFarmerPendingCredits(keycloakId: string) {
   
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');
    return this.prisma.creditOffer.findMany({
      where:   { loan:{borrowerId:farmer.id}, status: 'PENDING' },
      include: { loan: {
                  include: {
                    lender: { include: { trustProfile: true,},},
                    borrower: true,
                  }, }, },
      orderBy: { createdAt: 'desc' },
    });
  }


  private async ensureStripeCustomer(retailer: any): Promise<string> {
    if (retailer.stripeCustomerId) return retailer.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email:    retailer.email,
      name:     retailer.name ?? retailer.email,
      metadata: { userId: retailer.id },
    });

    await this.prisma.user.update({
      where: { id: retailer.id },
      data:  { stripeCustomerId: customer.id },
    });

    this.logger.log(`Stripe Customer created: ${customer.id} for ${retailer.id}`);
    return customer.id;
  }
  private stripeCardErrorMessage(code?: string): string {
    const messages: Record<string, string> = {
      insufficient_funds:          'Your card has insufficient funds. Please use a different card or top up your account.',
      card_declined:               'Your card was declined. Please check your card details or use a different card.',
      expired_card:                'Your card has expired. Please update your payment method.',
      incorrect_cvc:               'The CVC you entered is incorrect. Please try again.',
      processing_error:            'A processing error occurred. Please try again in a moment.',
      do_not_honor:                'Your card was declined by your bank. Please contact your bank or use a different card.',
      lost_card:                   'This card has been reported as lost. Please use a different card.',
      stolen_card:                 'This card has been reported as stolen. Please use a different card.',
      card_velocity_exceeded:      'Too many charges on this card in a short time. Please try again later.',
      authentication_required:     'This card requires authentication. Please add a new card and complete 3D Secure verification.',
    };
    return messages[code ?? '']
      ?? 'Your payment could not be processed. Please check your card or use a different one.';
  }

}


