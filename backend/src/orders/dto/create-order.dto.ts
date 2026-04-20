import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsString
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  status:string;
  @IsString()
  shippingAddress:string;
  @IsString()
  note:string;

  total: number;
}