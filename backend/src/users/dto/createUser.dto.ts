import { UserRole } from "@prisma/client";
import { IsEmail, IsString } from "class-validator";
export class CreateUserDto{
    @IsString()
    keycloakId: string;
    @IsEmail()
    email: string;
    role: UserRole;
}