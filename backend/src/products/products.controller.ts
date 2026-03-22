import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { Roles } from '../common/decorators/roles.decorator';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';

@Controller('products')
export class ProductsController {
 
  constructor(private readonly productsService: ProductsService) {}

    @Post()
    @Roles('FARMER')
    @UseInterceptors(FilesInterceptor('images', 5))
    create( 
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: CreateProductDto, 
        @Req() req: any
    ) {
        const keycloakId = req.user.sub;
        return this.productsService.create(dto, files, keycloakId);
    }

    
    @Get('/myproducts')
    @Roles('FARMER')
    findMyProduct(@Req() req: any){
        const keycloakId = req.user.sub;
        return this.productsService.findMyProducts(keycloakId);
    }
    @Patch(':id')
    @Roles('FARMER')
    update( @Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any ) {
        const keycloakId = req.user.sub;
        return this.productsService.update(id, dto, keycloakId);
    }
    @Get(':id/images/:imageId/url')
    @Roles('FARMER')
    getImageUrl(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
    ) {
    return this.productsService.getImagePresignedUrl(imageId);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }
    @Post(':id/images')
  @Roles('FARMER')
  @UseInterceptors(FileInterceptor('image'))
  addImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const keycloakId = req.user.sub;
    return this.productsService.addImage(id, file, keycloakId);
  }
    @Delete(':id/images/:imageId')
    @Roles('FARMER')
    deleteImage(
        @Param('id') id: string,
        @Param('imageId') imageId: string,
        @Req() req: any,
    ) {
        const keycloakId = req.user.sub;
        return this.productsService.deleteImage(id, imageId, keycloakId);
    }
    @Delete(':id')
    @Roles('FARMER')
    remove(@Param('id') id: string, @Req() req:any) {
        const keycloakId= req.user.sub;
        return this.productsService.remove(id, keycloakId);
    }
}

