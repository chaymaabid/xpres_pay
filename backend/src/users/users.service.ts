import { BadRequestException, Injectable, NotFoundException,Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {User, UserRole, Prisma, NotificationType} from '@prisma/client';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/createUser.dto';
import { AdminUsersQueryDto } from './dto/adminGetUsers.dto';
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma:PrismaService,private readonly configService: ConfigService,){}

  async create (dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data:{
        keycloakId: dto.keycloakId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        stripeAccountId: dto.stripeAccountId?? null,
      }
    })
  }
  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const user= this.prisma.user.findUnique({
      where: { keycloakId },
    });
    if (!user) {
            throw new Error("User not found");
        }
    return user;
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
  async findAll({ page,limit,search}
    ): Promise<User[]> {
    const skip =(page-1)*limit;
    const where:any={};
    
    if(search){
       where.OR = [
        { name: { contains: search, mode: 'insensitive' }  },
        { email: { contains: search, mode: 'insensitive' }  },
      
      ];
    }
    return this.prisma.user.findMany({
      where,
      skip,
      take:limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFarmers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: UserRole.FARMER },
    });
  }
  async findRetailers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: UserRole.RETAILER },
    });
  }
  async updateTrustScore(keycloakId:string,prisma: Prisma.TransactionClient | PrismaService = this.prisma){
    const user = await prisma.user.findUnique({
      where: { keycloakId },
      select: {
        id: true,
        trustProfile: {
          select: {
            id: true,
            trustScore: true,
          },
        },
      },
    });
    if (!user) { throw new NotFoundException('User not found');}

    if (!user.trustProfile) {
      throw new BadRequestException('Cannot update trust score: user has no trust profile',);
    }

    const updatedProfile = await prisma.trustProfile.update({
      where: {
        userId: user.id,
      },
      data: {
        trustScore: {
          increment: 20,
        },
      },
      select: {
      id: true,
        userId: true,
        trustScore: true,
        isVerified: true,
        updatedAt: true,
      },
    });
    
    return updatedProfile;
  }
  async getUsers(query: AdminUsersQueryDto) {
    const { page = 1, limit = 20, search, role } = query;
    const skip = (page - 1) * limit;
    const where: any = {  role: {not: 'ADMIN',},  };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'ADMIN') {
      where.role = role;
    }
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isEnabled: true,
          createdAt: true,
          stripeAccountId: true,
          stripeCustomerId: true,
          trustProfile: {
            select: {
              isVerified: true,
              trustScore: true,
            },
          },
          _count: {
            select: {
              ordersAsBuyer: true,
              products: true,
              loansGiven: true,
              loansTaken: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
 
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        trustProfile: {
          include: {
            devices: true,
          },
        },
        ordersAsBuyer: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            orderItems: {
              include: {
                product: {
                  select: { name: true, id: true },
                },
              },
            },
            transaction: {
              select: {
                id: true,
                status: true,
                totalPaid: true,
                platformFee: true,
                amountToTransfer: true,
                paymentIntentId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            stockAvailable: true,
          },
          take: 50,
        },
        loansGiven: {
          include: {
            borrower: {
              select: { id: true, name: true, email: true },
            },
            creditOffers: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
        loansTaken: {
          include: {
            lender: {
              select: { id: true, name: true, email: true },
            },
            creditOffers: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });
    const totalEarningResult = await this.prisma.transaction.aggregate({
      where: {
        status: 'RELEASED',
        order: {
          orderItems: {
            some: {
              product: {
              ownerId: userId,
              },
            },
          },
        },
      },
      _sum: {
        amountToTransfer: true,
      },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const totalSpent = user.ordersAsBuyer.reduce((sum, o) => sum + Number(o.transaction?.totalPaid),0,);
    const totalEarning = Number(totalEarningResult._sum.amountToTransfer || 0);
    const totalCreditGiven = user.loansGiven.reduce((sum, l) => sum + Number(l.totalCredit),0,);
    const totalCreditTaken = user.loansTaken.reduce((sum, l) => sum + Number(l.totalCredit),0,);
    return {
      ...user,
      stats: {
        totalOrders: user.ordersAsBuyer.length,
        totalSpent,
        totalEarning,
        totalProducts: user.products.length,
        totalDevices: user.trustProfile?.devices?.length ?? 0,
        totalCreditGiven,
        totalCreditTaken,
        loansGivenCount: user.loansGiven.length,
        loansTakenCount: user.loansTaken.length,
      },
    };
  }
  async setUserEnabled(userId: string, enabled: boolean) {
    // 1. Load user from DB to get keycloakId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, keycloakId: true, email: true, isEnabled: true },
    });
 
    if (!user) throw new NotFoundException(`User ${userId} not found`);
 
    // 2. Guard: don't allow no-op (optional but clean)
    if (user.isEnabled === enabled) {
      return { success: true, isEnabled: enabled }; // already in desired state
    }
 
    // 3. Call Keycloak to update the user
    const kc = await this.getAuthenticatedKcClient();
    await kc.users.update(
      { id: user.keycloakId },
      { enabled },
    );
    this.logger.log(
      `Keycloak user ${user.email} ${enabled ? 'enabled' : 'disabled'} by admin`,
    );
 
    // 4. Mirror the state in our DB
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data:  { isEnabled: enabled },
      select: { id: true, isEnabled: true },
    });
 
    return { success: true, isEnabled: updated.isEnabled };
  }
  private async getAuthenticatedKcClient(): Promise<KcAdminClient> {
    const client = new KcAdminClient({
      baseUrl:   this.configService.get<string>('KEYCLOAK_URL'),
      realmName: 'master',
    });
 
    await client.auth({
      grantType: 'password',
      clientId:  'admin-cli',
      username:  this.configService.get<string>('KEYCLOAK_ADMIN_CL_USERNAME'),
      password:  this.configService.get<string>('KEYCLOAK_ADMIN_CL_PASSWORD'),
    });
 
    client.setConfig({
      realmName: this.configService.get<string>('KEYCLOAK_REALM'),
    });
 
    return client;
  }
}