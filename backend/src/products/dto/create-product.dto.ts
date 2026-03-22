import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateProductDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()           
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockAvailable?: number;
}