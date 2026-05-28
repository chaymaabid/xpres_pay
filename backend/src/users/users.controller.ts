import { Controller, Get, Req, Headers, UseGuards, UnauthorizedException, Query, Param, Patch, Body } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {  Public } from 'nest-keycloak-connect';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { AdminUsersQueryDto } from './dto/adminGetUsers.dto';
import { SetUserEnabledDto } from './dto/set-user-enable.dto';


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
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.usersService.getUsers(query);
  }
  @Get(':id')
  @Roles('ADMIN')
  getUserDetail(@Param('id') id: string) {
    return this.usersService.getUserDetail(id);
  }
  @Patch(':id/enabled')
  setUserEnabled(
    @Param('id') id: string,
    @Body() dto: SetUserEnabledDto,
  ) {
    return this.usersService.setUserEnabled(id, dto.enabled);
  }
}