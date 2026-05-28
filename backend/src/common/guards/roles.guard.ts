import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException, 
  Logger 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; 
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    const userRoles: string[] = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      ...(Array.isArray(user.realm_access?.roles) ? user.realm_access.roles : []),
    ];

    
    this.logger.verbose(`Required roles: ${requiredRoles.join(', ')}`);
    this.logger.verbose(`User has roles: ${userRoles.join(', ')}`);

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(`Access denied - Required: [${requiredRoles}], User has: [${userRoles}]`);
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(' or ')}`
      );
    }

    this.logger.verbose('✅ Role check passed');
    return true;
  }
}