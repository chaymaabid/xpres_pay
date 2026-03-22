import { Controller, Post,Req,Body } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
    constructor( private readonly orderService: OrdersService){}
    @Post()
    @Roles('RETAILER')
    createOrder(@Body() dto: CreateOrderDto, @Req() req: any){
         const keycloakId = req.user.sub;
        return this.orderService.Order(dto,keycloakId);

    }
}
