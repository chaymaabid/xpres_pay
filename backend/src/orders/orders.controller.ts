import { Controller, Post,Req,Body,Get,Query, Param } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { Resource } from 'nest-keycloak-connect';

@Controller('orders')
export class OrdersController {
    constructor( private readonly orderService: OrdersService){}
    
    @Get('farmer-escrows')
    @Roles('FARMER')
    getFarmerEscrows(@Req() req: any) {
        const keycloakId = req.user.sub;
        return this.orderService.getFarmerEscrows(keycloakId);
    }
    @Get()
    @Roles('RETAILER', 'FARMER')
    findAll(
        @Req() req,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        const userRoles:string[]=req.user.roles??[];
        const role = userRoles.find((r)=>['RETAILER','FARMER'].includes(r));
        const userId = req.user.sub;
        return this.orderService.findAllByRole({role,userId,page: parseInt(page),limit: parseInt(limit),status,search,});
    }
    @Get(':id')
    findOne(@Req() req, @Param('id') id: string) {
        return this.orderService.findOne(id, req.user.sub);
    }
    @Post()
    @Roles('RETAILER')
    createOrder(@Body() dto: CreateOrderDto, @Req() req: any){
         const keycloakId = req.user.sub;
        return this.orderService.Order(dto,keycloakId);

    }
}
