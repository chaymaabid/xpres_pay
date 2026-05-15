import { Injectable ,Inject, BadRequestException, NotFoundException, ForbiddenException} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrderItemsService } from '../order-items/order-items.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from 'src/order-items/dto/create-order-items';
import { TransactionLedgerService } from 'src/transaction-ledger/transaction-ledger.service';
import { contains } from 'class-validator';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from '@prisma/client';



@Injectable()
export class OrdersService {
 
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly productService: ProductsService,
    private readonly orderItemsService: OrderItemsService,
    private readonly ledger: TransactionLedgerService,
    private readonly notificationService: NotificationService,
  ) {}
 
async Order(dto: CreateOrderDto, keycloakId: string) {
  const buyer = await this.usersService.findByKeycloakId(keycloakId);
  if (!buyer) throw new Error('Buyer not found');
 
  let farmerId: string | undefined;
  for (const item of dto.items) {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, stockAvailable: true, ownerId: true },
    });
    if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
    if (product.stockAvailable < item.quantity) {
      throw new BadRequestException(
        `"${product.name}" only has ${product.stockAvailable} unit(s) available, but you requested ${item.quantity}.`,
      );
    }
    // All items must belong to the same farmer (single-farmer checkout)
    if (!farmerId) farmerId = product.ownerId;
  }
 
  let loan: { id: string; totalCredit: number; totalUsed: number } | null = null;
  let creditApplied = 0;     
  let remainingAmount = 0;    
 
  if (dto.useLoanCredit && farmerId) {
    const rawLoan = await this.prisma.loan.findUnique({
      where: { lenderId_borrowerId: { lenderId: buyer.id, borrowerId: farmerId } },
      select: { id: true, totalCredit: true, totalUsed: true },
    });
 
    if (rawLoan) {
      loan = {
        id: rawLoan.id,
        totalCredit: rawLoan.totalCredit.toNumber(),
        totalUsed: rawLoan.totalUsed.toNumber(),
      };
    }
  }
 
  let preliminarySubtotal = 0;
  for (const item of dto.items) {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
      select: { price: true },
    });
    preliminarySubtotal += product!.price.toNumber() * item.quantity;
  }
  const preliminaryTax = parseFloat((preliminarySubtotal * 0.05).toFixed(2));
  const preliminaryTotal = preliminarySubtotal + preliminaryTax;
 
  if (loan) {
    const available = loan.totalCredit - loan.totalUsed;
    creditApplied = Math.min(available, preliminaryTotal);
  }
  remainingAmount = parseFloat((preliminaryTotal - creditApplied).toFixed(2));
 
  let paymentIntent: { id: string; client_secret: string | null } | null = null;
  if (remainingAmount > 0) {
    paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(remainingAmount * 100), 
      currency: 'usd',
      metadata: {
        buyerId: buyer.id,
        buyerEmail: buyer.email ?? '',
        loanId: loan?.id ?? '',
        creditApplied: creditApplied.toString(),
      },
    });
  }
 
  return this.prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const orderItems: CreateOrderItemDto[] = [];
 
    for (const item of dto.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stockAvailable: { gte: item.quantity } },
        data: { stockAvailable: { decrement: item.quantity } },
      });
      if (updated.count === 0) throw new BadRequestException('Not enough stock');
 
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      farmerId = product?.ownerId;
      const price = product!.price.toNumber();
      subtotal += price * item.quantity;
 
      orderItems.push({
        productId: product!.id,
        quantity: item.quantity,
        unitPriceAtOrder: price,
      });
    }
 
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const total = subtotal + tax;
 
    const order = await tx.order.create({
      data: {
        buyer: { connect: { id: buyer.id } },
        totalAmount: subtotal,
        status: creditApplied > 0 && remainingAmount === 0 ? 'confirmed' : 'pending_payment',
        shippingAddress: dto.shippingAddress,
        note: dto.note,
      },
    });
 
    await this.orderItemsService.createManyOrderItems(orderItems, order.id, tx);
 
    if (loan && creditApplied > 0) {
      await tx.loan.update({
        where: { id: loan.id },
        data: { totalUsed: { increment: creditApplied } },
      });
    }
    const fullyPaid = remainingAmount === 0;
    const txRecord = await tx.transaction.create({
      data: {
        orderId: order.id,
        orderAmount: subtotal,
        platformFee: tax,
        totalPaid: total,
        amountToTransfer:remainingAmount-preliminaryTax,
        status: fullyPaid ? 'LOCKED' : 'INITIATED',
        paymentIntentId: paymentIntent?.id ?? null,
        loanId: loan?.id ?? null,       
      },
    });
 
    await tx.transactionLedger.create({
      data: {
        transactionId: txRecord.id,
        amount: subtotal,
        previousStatus: 'INITIATED',
        currentStatus: fullyPaid ? 'LOCKED' : 'INITIATED',
        actorId: buyer.id,
      },
    });
 
    if (farmerId) {
      await this.notificationService.create({
        userId: farmerId,
        type: NotificationType.ORDER_CREATED,
        title: 'New Order',
        message: `New Order Created by ${buyer.name}`,
        url: `/farmer/orders/${order.id}`,
      });
    }
    return {
      orderId: order.id,
      clientSecret: paymentIntent?.client_secret ?? null,
      fullyPaid,                          
      creditApplied,                     
      remainingAmount,                    
    };
  });
}
async getLoanForRetailer(
  keycloakId: string,
  farmerId: string,
): Promise<{ loanId: string; availableCredit: number } | null> {
  // Resolve the retailer's internal id from their keycloak id
  const retailer = await this.usersService.findByKeycloakId(keycloakId);
  if (!retailer) throw new NotFoundException('User not found');
 
  const loan = await this.prisma.loan.findUnique({
    where: {
      // The retailer is the LENDER (they offered credit TO the farmer)
      lenderId_borrowerId: { lenderId: retailer.id, borrowerId: farmerId },
    },
    select: { id: true, totalCredit: true, totalUsed: true },
  });
 
  if (!loan) return null; // no loan exists — frontend hides the credit toggle
 
  const availableCredit = loan.totalCredit.toNumber() - loan.totalUsed.toNumber();
 
  if (availableCredit <= 0) return null; // loan exists but exhausted
 
  return {
    loanId: loan.id,
    availableCredit,
  };
}
  async findAllByRole({
  role,
  userId,
  page,
  limit,
  status,
  search,
}: any) {
  if (role === 'RETAILER') {
    return this.RetailerfindAll({
      buyerId: userId,
      page,
      limit,
      status,
      search,
    });
  }

  if (role === 'FARMER') {
    return this.farmerfindAll({
      farmerId: userId,
      page,
      limit,
      status,
      search,
    });
  }

  throw new ForbiddenException('Invalid role');
}
  async RetailerfindAll({ buyerId, page, limit, status, search }) {
    const skip = (page - 1) * limit;
    const buyer= await this.usersService.findByKeycloakId(buyerId);
    const idBuyer=buyer?.id
    const where: any = { buyerId:idBuyer };
    if (status) {
      where.transaction = {
        is: {
          status,
        },
      };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderItems: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } },
         { orderItems: { some: { product: { owner: {name: {  contains: search,  mode: 'insensitive',},} } } } },
      ];
    }
 
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: { product: { select: { id: true, name: true, owner: { select: { id: true, name: true } } } } },
          },
          transaction: { select: { status: true, totalPaid: true, proofOfDelivery:true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
 
    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
  async farmerfindAll({ farmerId, page, limit, status, search }) {
    const skip = (page - 1) * limit;
    const farmer= await this.usersService.findByKeycloakId(farmerId);
    const where: any = {
    orderItems: {
      some: {
        product: {
          ownerId: farmer?.id,
        },
      },
    },
  };
    if (status) {
      where.transaction = {
        is: {
          status,
        },
      };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderItems: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } },
         { orderItems: { some: { product: { owner: {name: {  contains: search,  mode: 'insensitive',},} } } } },
      ];
    }
 
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: { product: { select: { id: true, name: true, owner: { select: { id: true, name: true } } } } },
          },
          transaction: { select: { status: true, orderAmount: true, proofOfDelivery:true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
 
    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, keycloackId: string) {
    const user=await this.usersService.findByKeycloakId(keycloackId);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                owner: { select: { id: true, name: true } },
              },
            },
          },
        },
        transaction: {
          include: {
            ledgerEntries: { orderBy: { timestamp: 'asc' } },
          },
        },
      },
    });
 
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== user?.id && !(order.orderItems.some((o)=>o.product.ownerId==user?.id))) throw new ForbiddenException();
 
    return order;
  }

  async getFarmerEscrows(keycloakId: string) {
    const farmer = await this.usersService.findByKeycloakId(keycloakId);
    if (!farmer) throw new BadRequestException('Farmer not found');
    // Get all orders related to that farmer with transaction status LOCKED
    const orders = await this.prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            product: { ownerId: farmer.id },
          },
        },
        transaction: {
          status: 'LOCKED',
        },
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            amountToTransfer:true,
            orderAmount: true,
            createdAt: true,
          },
        },
        orderItems: {
          where: {
            product: { ownerId: farmer.id },  // only this farmer's items
          },
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
 
    return orders;
  }
}
