import { IsBoolean } from 'class-validator';
export class SetUserEnabledDto {
  @IsBoolean()
  enabled!: boolean;
}