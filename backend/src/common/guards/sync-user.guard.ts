import {  Injectable,CanActivate,ExecutionContext, Logger, } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class SyncUserGuard implements CanActivate {
  private readonly logger = new Logger(SyncUserGuard.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.user;

    if (!token) return true;

    const keycloakId = token.sub;

    this.logger.verbose(`🔑 Checking user sync for: ${keycloakId}`);

    const existing = await this.usersService.findByKeycloakId(keycloakId);

    if (!existing) {
      this.logger.log('⚡ User not found → syncing...');

      await this.authService.syncUser(request.user);

      this.logger.log('✅ User synced successfully');
    }

    return true;
  }
}