import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateProductDto, keycloakId: string) {
        const user = await this.prisma.user.findUnique({
                        where: {
                        keycloakId: keycloakId
                        }
                    });

        if (!user) {
            throw new Error("User not found");
        }

        return this.prisma.product.create({
            data: {
            name: dto.name,
            description: dto.description,
            price: dto.price,
            owner: {
                connect: { id: user.id }
            }
            }
        });
    }
    async update(id: string, updateProductDto: UpdateProductDto, keycloakId: string) {

        if ((await this.findOne(id)).owner.keycloakId == keycloakId)
        {
            return this.prisma.product.update({
                where:{id},
                data:updateProductDto
            })
        }
        else
            throw new Error("A farmer can only update his product");
    }
    async findMyProducts(keycloakId: string) {

        const user = await this.prisma.user.findUnique({ where: { keycloakId } });
         if (!user) {
            throw new Error("User not found");
        }
        return this.prisma.product.findMany({
            where: {
                ownerId: user.id
                }
            });
    }
    async findAll() {
        return this.prisma.product.findMany({
        include: {
            owner: true,
        },
        });
    }
    async findOne(id: string) {

        const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
            owner: true,
        },
        });

        if (!product) {
        throw new NotFoundException('Product not found');
        }

        return product;
    }
    async remove(id: string, keycloakId) {
        if ((await this.findOne(id)).owner.keycloakId == keycloakId)
        {
            return this.prisma.product.delete({
                where:{id},
            })
        }
        else
            throw new Error("A farmer can only delete his product");
    }
}
