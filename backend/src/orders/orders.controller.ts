import { Controller, Post,Req,Body,Get,Query, Param } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
    constructor( private readonly orderService: OrdersService){}
    
    @Get()
    findAll(
        @Req() req,
        @Query('page')page='1',
        @Query('limit')limit='10',
        @Query('status')status?:string,
        @Query('search') search?:string,
    ){
        return this.orderService.findAll({
            buyerId:req.user.sub,
            page:parseInt(page),
            limit:parseInt(limit),
            status,
            search,
        });
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
