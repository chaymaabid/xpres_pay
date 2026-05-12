import { Controller, Get, Req, Headers, UseGuards, UnauthorizedException, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {  Public } from 'nest-keycloak-connect';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersService } from './users.service';


@Controller('users')
export class UserController{
    constructor(private prisma:PrismaService,
                private readonly usersService: UsersService,
    ){}

 

  @Get('trust-status')
  async getStatus(@Req() req: any, @Headers('x-device-fingerprint') fingerprint: string) {
    
    
    const keycloakUser = req.user;

    if (!keycloakUser || !keycloakUser.sub) {
      console.error("Token Keycloak manquant ou invalide dans la requête");
      throw new UnauthorizedException('Invalid Keycloak session');
    }

    console.log("🔑 Keycloak sub (keycloakId) détecté :", keycloakUser.sub);

    const dbUser = await this.prisma.user.findUnique({
      where: { keycloakId: keycloakUser.sub }, 
      include: {
        trustProfile: {
          include: { devices: true },
        },
      },
    });
    
    if (!dbUser || !dbUser.trustProfile) {
      return { hasProfile: false, isDeviceTrusted: false };
    }

    const isDeviceTrusted = dbUser.trustProfile.devices.some(
      (d) => d.deviceFingerprint === fingerprint,
    );

    return { hasProfile: true, isDeviceTrusted };
  }
  @Get()
  @Roles('ADMIN')
  getAllUsers(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    ) {
    this.usersService.findAll({page: parseInt(page),limit: parseInt(limit),search,})
  }
}