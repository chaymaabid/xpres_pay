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
    // check available quantity first
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stockAvailable: true },
      });
 
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      if (product.stockAvailable < item.quantity) {
        throw new BadRequestException(
          `"${product.name}" only has ${product.stockAvailable} unit(s) available, but you requested ${item.quantity}.`,
        );
      }
    }
    return this.prisma.$transaction(async (tx) => {
      // ── 1. Compute total from products ──────────────────────────────────
      let subtotal = 0;
      const orderItems :CreateOrderItemDto [] =[];
 
      for (const item of dto.items) {
        const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockAvailable: { gte: item.quantity },
        },
        data: {
          stockAvailable: { decrement: item.quantity },
        },
        });

      if (updated.count === 0) {
        throw new BadRequestException('Not enough stock');
      }

      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      farmerId=product?.ownerId;
      const price = product!.price.toNumber();
      subtotal += price * item.quantity;

      orderItems.push({
        productId: product!.id,
        quantity: item.quantity,
        unitPriceAtOrder: price,
      });
      }
      
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      const total= subtotal+tax
      // ── 2. Create Stripe PaymentIntent (money stays on platform) ────────
      //    No transfer_data → funds go to platform account (escrow)
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: total * 100,   
        currency: 'usd',
        // Do NOT add transfer_data here — funds stay in platform escrow
        // until you manually transfer after delivery confirmation
        metadata: {
          buyerId: buyer.id,
          buyerEmail: buyer.email ?? '',
        },
      });
 
      // ── 3. Create Order with paymentIntentId ────────────────────────────
      const order = await tx.order.create({
        data: {
          buyer: { connect: { id: buyer.id } },
          totalAmount: subtotal,
          status: 'pending_payment',
          shippingAddress: dto.shippingAddress,
          note: dto.note,
          
        },
      });
 
      // ── 4. Create order items ───────────────────────────────────────────
      await this.orderItemsService.createManyOrderItems(orderItems, order.id, tx);
 
      // ── 5. Create transaction record ────────────────────────────────────
      const txRecord= await tx.transaction.create({
        data: {
          orderId: order.id,
          orderAmount:subtotal,
          platformFee:tax,
          totalPaid:total,
          status: 'INITIATED',
          paymentIntentId: paymentIntent.id, 
        },
      });
      await tx.transactionLedger.create({
        data:{
          transactionId:txRecord.id,
          amount:subtotal,
          previousStatus: 'INITIATED',
          currentStatus: 'INITIATED',
          actorId: buyer.id,
        }
      });
      
      if (farmerId) {
        await this.notificationService.create({
        userId: farmerId,
        type: NotificationType.ORDER_CREATED,
        title: 'New Order',
        message: `New Order Created by ${buyer.name}`,
        url: `farmer/orders/${order.id}`,
        });
      }
      // ── 6. Return orderId + clientSecret to frontend ────────────────────
      return {
        orderId: order.id,
        clientSecret: paymentIntent.client_secret,
      };
    });
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
