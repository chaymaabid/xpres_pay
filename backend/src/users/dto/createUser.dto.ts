import { UserRole } from "@prisma/client";
import { IsEmail, IsOptional, IsString } from "class-validator";
export class CreateUserDto{
    @IsString()
    keycloakId: string;
    @IsEmail()
    email: string;
    name: string;
    role: UserRole;
    @IsOptional()
    @IsString()
    stripeAccountId?: string | null;
}