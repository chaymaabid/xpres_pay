import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { Roles } from '../common/decorators/roles.decorator';
@Controller('products')
export class ProductsController {
 
  constructor(private readonly productsService: ProductsService) {}

    @Post()
    @Roles('FARMER')
    create( @Body() dto: CreateProductDto, @Req() req: any) {
        const keycloakId = req.user.sub;
        return this.productsService.create(dto, keycloakId);
    }

    @Patch(':id')
    @Roles('FARMER')
    update( @Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any ) {
        const keycloakId = req.user.sub;
        return this.productsService.update(id, dto, keycloakId);
    }

    @Get('/myproducts')
    @Roles('FARMER')
    findMyProduct(@Req() req: any){
        const keycloakId = req.user.sub;
        return this.productsService.findMyProducts(keycloakId);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Delete(':id')
    @Roles('FARMER')
    remove(@Param('id') id: string, @Req() req:any) {
        const keycloakId= req.user.sub;
        return this.productsService.remove(id, keycloakId);
    }
}

