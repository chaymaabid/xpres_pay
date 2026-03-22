import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService, private storageService:StorageService) {}

    async create(dto: CreateProductDto, files:Express.Multer.File[], keycloakId: string) {
        const user = await this.prisma.user.findUnique({
                        where: {
                        keycloakId: keycloakId
                        }
                    });

        if (!user) {
            throw new Error("User not found");
        }

        const product= this.prisma.product.create({
            data: {
            name: dto.name,
            description: dto.description,
            price: dto.price,
            stockAvailable: dto.stockAvailable ?? 0,
            owner: {
                connect: { id: user.id }
            }
            }
        });
        for (const file of files){
            const path=await this.storageService.uploadFile(file,'products',(await product).id);
            await this.prisma.productImage.create({
                data:{
                    url:path,
                    productId: (await product).id
                }
            })

        }

    }
    
    async findMyProducts(keycloakId: string) {

        const user = await this.prisma.user.findUnique({ where: { keycloakId } });
         if (!user) {
            throw new Error("User not found");
        }
        return this.prisma.product.findMany({
            where: {
                ownerId: user.id
                },
            include:{
                images:true,
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
    async findOne(id: string, prisma: Prisma.TransactionClient | PrismaService = this.prisma) {

        const product = await prisma.product.findUnique({
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
    async getImagePresignedUrl(imageId: string): Promise<{ url: string }> {
        const image = await this.prisma.productImage.findUnique({
        where: { id: imageId },
        });
        if (!image) throw new NotFoundException('Image not found');
  
        const url = await this.storageService.getSignedFileUrl(image.url); // image.url is the minio key
        return { url };
    }
    async update(productId: string, dto: UpdateProductDto, keycloakId: string) {
  const user = await this.prisma.user.findUnique({ where: { keycloakId } });
  if (!user) throw new Error('User not found');

  // Make sure the product belongs to this farmer
  const product = await this.prisma.product.findFirst({
    where: { id: productId, ownerId: user.id },
  });
  if (!product) throw new NotFoundException('Product not found');

  return this.prisma.product.update({
    where: { id: productId },
    data: {
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.stockAvailable !== undefined && { stockAvailable: dto.stockAvailable }),
    },
    include: { images: true },
  });
}
    async deleteImage(productId: string, imageId: string, keycloakId: string) {
  const user = await this.prisma.user.findUnique({ where: { keycloakId } });
  if (!user) throw new Error('User not found');

  // Verify ownership
  const product = await this.prisma.product.findFirst({
    where: { id: productId, ownerId: user.id },
  });
  if (!product) throw new NotFoundException('Product not found');

  const image = await this.prisma.productImage.findUnique({
    where: { id: imageId },
  });
  if (!image) throw new NotFoundException('Image not found');

  // Delete from MinIO then from DB
  await this.storageService.deleteFile(image.url); // image.url is the minio key
  await this.prisma.productImage.delete({ where: { id: imageId } });

  return { success: true };
}
async addImage(productId: string, file: Express.Multer.File, keycloakId: string) {
  const user = await this.prisma.user.findUnique({ where: { keycloakId } });
  if (!user) throw new Error('User not found');

  const product = await this.prisma.product.findFirst({
    where: { id: productId, ownerId: user.id },
  });
  if (!product) throw new NotFoundException('Product not found');

  const key = await this.storageService.uploadFile(file, 'products', productId);

  return this.prisma.productImage.create({
    data: { url: key, productId },
  });
}
    async deleteFile(key:string): Promise<void>{
        await this.storageService.deleteFile(key);
    }
}
