import {
  IsUUID, IsNumber, IsPositive,
  IsOptional, IsString, Max,
} from 'class-validator';

export class CreateCreditDto {
  @IsUUID()
    borrowerId!: string;

  @IsNumber()
    @IsPositive()
    @Max(1000000)
    amount!: number;

  @IsOptional()
  @IsString()
  note?: string;
}