import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get authenticated Keycloak admin client
   */
  private async getAuthenticatedClient(): Promise<KcAdminClient> {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const xprespayRealm = this.configService.get<string>('KEYCLOAK_REALM');

    // Create a new client instance
    const client = new KcAdminClient({
      baseUrl: keycloakUrl,
      realmName: 'master', 
    });

    try {
      // Authenticate with admin credentials
      await client.auth({
        grantType: 'password',
        clientId: 'admin-cli',
        username: this.configService.get<string>('KEYCLOAK_ADMIN_CL_USERNAME'),
        password: this.configService.get<string>('KEYCLOAK_ADMIN_CL_PASSWORD'),
      });

      // Now switch to xprespay realm for operations
      client.setConfig({
        realmName: xprespayRealm,
      });

      return client;
      
    } catch (error) {
      this.logger.error('Failed to authenticate with Keycloak:', error);
      throw new BadRequestException('Failed to connect to authentication server');
    }
  }

  /**
   * Register a new user - creates user in Keycloak + our DB
   */
  async register(dto: RegisterDto) {
    try {
      const kc = await this.getAuthenticatedClient();

      // Check if user already exists in Keycloak
      const existingUsers = await kc.users.find({
        email: dto.email,
        exact: true,
      });

      if (existingUsers.length > 0) {
        throw new ConflictException('User with this email already exists');
      }

      // Create user in Keycloak
      const createdUser = await kc.users.create({
        email: dto.email,
        username: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        enabled: true,
        emailVerified: true, 
        credentials: [
          {
            type: 'password',
            value: dto.password,
            temporary: false,
          },
        ],
      });

      this.logger.log(`Created Keycloak user: ${dto.email}`);

      const keycloakUserId = createdUser.id;

      // Get the role from Keycloak
      const realmRole = await kc.roles.findOneByName({
        name: dto.role,
      });

      if (!realmRole) {
        throw new BadRequestException(`Role ${dto.role} not found in Keycloak`);
      }

      // Assign role to user in Keycloak
      await kc.users.addRealmRoleMappings({
        id: keycloakUserId,
        roles: [
          {
            id: realmRole.id!,
            name: realmRole.name!,
          },
        ],
      });

      this.logger.log(`Assigned role ${dto.role} to user ${dto.email}`);

      // Create user in our database
      await this.usersService.create({
        keycloakId: keycloakUserId,
        email: dto.email,
        role: dto.role,
      });

      this.logger.log(`Created user in database: ${dto.email}`);

      return {
        success: true,
        message: 'Account created successfully',
        user: {
          email: dto.email,
          role: dto.role,
        },
      };

    } catch (error) {
      this.logger.error('Registration error:', error);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.response?.data?.errorMessage || 
        error.message || 
        'Failed to create account'
      );
    }
  }

  /**
   * Syncs Keycloak user after login
   */
  async syncUser(keycloakPayload: any) {
    const { sub, email, realm_access } = keycloakPayload;
    const roles: string[] = realm_access?.roles ?? [];

    const role = roles.includes('FARMER')
      ? UserRole.FARMER
      : roles.includes('RETAILER')
      ? UserRole.RETAILER
      : null;

    const existing = await this.usersService.findByKeycloakId(sub);
    if (existing) return { user: existing, isNew: false };

    if (!role) {
      this.logger.warn(`User ${email} has no role assigned`);
    }

    const newUser = await this.usersService.create({
      keycloakId: sub,
      email,
      role: role as UserRole,
    });

    this.logger.log(`Synced user: ${email}`);
    return { user: newUser, isNew: true };
  }

  getMe(keycloakId: string) {
    return this.usersService.findByKeycloakId(keycloakId);
  }
}