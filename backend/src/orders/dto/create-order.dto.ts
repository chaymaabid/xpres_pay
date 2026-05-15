import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {

  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsString()
  shippingAddress!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  total!: number;

  @IsOptional()
  @IsBoolean()
  useLoanCredit?: boolean;
}