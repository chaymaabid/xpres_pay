import {
  Injectable, BadRequestException,
  NotFoundException, InternalServerErrorException, Logger,
  Inject,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TransactionLedgerService } from '../transaction-ledger/transaction-ledger.service';
import { KycVisionService } from '../kyc/kyc.vision';
import { EscrowState } from '@prisma/client';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly ledger: TransactionLedgerService,
    private readonly config: ConfigService,
    private readonly minioStorage: StorageService,
  ) {
  }

  // ── Step 2: OCR verification ─────────────────────────────────────────────
  async verifyProofOfDelivery(
    orderId: string,
    file: Express.Multer.File,
    keycloakId: string,
  ) {
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');

    // Verify this order actually belongs to this farmer
    const order = await this.findFarmerOrder(orderId, farmer.id,EscrowState.LOCKED);

    // Convert file buffer to base64 for the vision service
    const base64File = file.buffer.toString('base64');
    const mimeType   = file.mimetype; // image/jpeg, image/png, application/pdf

    // Call FastAPI OCR service — reuse KycVisionService pattern
    // We search for the full orderId AND the first 8 characters (short ID)
    const shortId = orderId.replace(/-/g, '').substring(0, 8).toUpperCase();

    let ocrResponse: { matched: boolean; confidence: number; extracted_text: string };

    try {
      ocrResponse = await this.callOcrService(base64File, mimeType, orderId, shortId);
    } catch (err) {
      this.logger.error('OCR service error', err);
      throw new InternalServerErrorException('OCR service unavailable');
    }
   this.logger.log(`OCR TEXT: ${ocrResponse.extracted_text}`);
    this.logger.log(`ORDER ID: ${orderId}`);

    if (ocrResponse.matched){
      const url=await this.minioStorage.uploadFile(file,'pod',orderId);
      await this.prisma.transaction.update({
        where:{orderId},
        data:{
          proofOfDelivery: url,
          ocrConfidence: ocrResponse.confidence ?? null,
        }
      })
      await this.ledger.deliver(orderId)
    }

    return {
      matched:    ocrResponse.matched,
      confidence: ocrResponse.confidence,
      orderId,
      shortId,
    };
  }

  async releaseFunds(orderId: string, keycloakId: string) {
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');

    if (!farmer.stripeAccountId) {
      throw new BadRequestException(
        'Farmer does not have a connected Stripe account. Please complete onboarding first.',
      );
    }

    const order = await this.findFarmerOrder(orderId, farmer.id, EscrowState.DELIVERED);

    const transaction = await this.prisma.transaction.findUnique({
      where: { orderId },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== 'DELIVERED') {
      throw new BadRequestException(
        `Cannot release funds: transaction is in ${transaction.status} state, expected DELIVERED.`,
      );
    }

    // ── Stripe transfer: platform → farmer connected account ──────────────
    let transfer: Stripe.Transfer;
    const subtotal = Number(transaction.amount) / 1.085
    try {
      transfer = await this.stripe.transfers.create({
        amount:     subtotal * 100, // cents
        currency:    'usd',
        destination: farmer.stripeAccountId,
        metadata: {
          orderId,
          farmerId: farmer.id,
        },
      });
    } catch (err: any) {
      this.logger.error('Stripe transfer failed', err);
      throw new InternalServerErrorException(
        `Stripe transfer failed: ${err.message}`,
      );
    }
   await this.ledger.release(orderId);

    return {
      success:    true,
      transferId: transfer.id,
      amount:     Number(transaction.amount),
      farmerId:   farmer.id,
    };
  }

  /** Verify the order exists, is in LOCKED state, and belongs to this farmer */
  private async findFarmerOrder(orderId: string, farmerId: string, status:EscrowState) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        orderItems: {
          some: { product: { ownerId: farmerId } },
        },
        transaction: { status: status },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found, not in LOCKED state, or does not belong to you.',
      );
    }

    return order;
  }

  /** Call FastAPI OCR endpoint — mirrors KycVisionService.post() pattern */
  private async callOcrService(
    base64File: string,
    mimeType: string,
    fullOrderId: string,
    shortOrderId: string,
  ): Promise<{ matched: boolean; confidence: number; extracted_text: string }> {
    const url = `${this.config.get('KYC_VISION_URL', 'http://kyc-vision:8000')}/verify/proof-delivery`;

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64:   base64File,
        mimeType,
        fullOrderId,
        shortOrderId, // FastAPI will search for either
      }),
    });

    if (!response.ok) {
      throw new Error(`OCR service returned ${response.status}`);
    }

    return response.json();
  }
  async getPodUrl(transactionId: string): Promise<{ url: string }> {
  const tx = await this.prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      proofOfDelivery: true,
    },
  });

  if (!tx || !tx.proofOfDelivery) {
    throw new NotFoundException('Proof of delivery not found');
  }

  const url = await this.minioStorage.getSignedFileUrl(
    tx.proofOfDelivery,
  );

  return { url };
}
}