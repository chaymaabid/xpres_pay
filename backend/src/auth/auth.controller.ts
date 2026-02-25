import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user with role' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('keycloak-jwt')
  @ApiOperation({ summary: 'Sync Keycloak user to DB' })
  syncUser(@Req() req: any) {
    return this.authService.syncUser(req.user);
  }

  @Get('me')
  @ApiBearerAuth('keycloak-jwt')
  @ApiOperation({ summary: 'Get current user' })
  getMe(@Req() req: any) {
    return this.authService.getMe(req.user.sub);
  }

  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }
}