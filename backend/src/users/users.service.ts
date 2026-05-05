import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {User, UserRole, Prisma, NotificationType} from '@prisma/client';
import { CreateUserDto } from './dto/createUser.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma:PrismaService){}

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
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
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
}