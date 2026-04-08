import { Injectable, Logger, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { RegisterDto } from './dto/register.dto';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
     @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
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

    // 1. Check duplicate
    const existingUsers = await kc.users.find({ email: dto.email, exact: true });
    if (existingUsers.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    // 2. Create in Keycloak
    const createdUser = await kc.users.create({
      email: dto.email,
      username: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      enabled: true,
      emailVerified: false,
      credentials: [{ type: 'password', value: dto.password, temporary: false }],
    });

    const keycloakUserId = createdUser.id;
    this.logger.log(`Created Keycloak user: ${dto.email}`);

    // 3. Assign role
    const realmRole = await kc.roles.findOneByName({ name: dto.role });
    if (!realmRole) throw new BadRequestException(`Role ${dto.role} not found`);

    await kc.users.addRealmRoleMappings({
      id: keycloakUserId,
      roles: [{ id: realmRole.id!, name: realmRole.name! }],
    });
    this.logger.log(`Assigned role ${dto.role} to user ${dto.email}`);

    // 4. Send email verification
    await kc.users.sendVerifyEmail({ id: createdUser.id });

    // 5. ── STRIPE (must happen BEFORE DB insert) ──────────────────
    let stripeAccountId: string | null = null;
    let stripeOnboardingUrl: string | null = null;

    this.logger.log(`Checking role for Stripe: "${dto.role}" === "${UserRole.FARMER}" → ${dto.role === UserRole.FARMER}`);

    if (dto.role === UserRole.FARMER) {
      this.logger.log(`Creating Stripe Express account for: ${dto.email}`);
      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        email: dto.email,
        capabilities: {
        transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          email: dto.email,
        },
        business_profile: {
          url: 'https://p60m3x78-3000.euw.devtunnels.ms',
        },
        metadata: {
          keycloakId: keycloakUserId,
          platform: 'xprespay',
        },
      });

      stripeAccountId = stripeAccount.id;
      this.logger.log(`Created Stripe Express account: ${stripeAccountId}`);

      const accountLink = await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${this.configService.get('FRONTEND_URL')}/auth/stripe/refresh?accountId=${stripeAccountId}`,
        return_url: `${this.configService.get('FRONTEND_URL')}/auth/stripe/complete`,
        type: 'account_onboarding',
      });

      stripeOnboardingUrl = accountLink.url;
      this.logger.log(`Generated onboarding link for: ${dto.email}`);
    } else {
      this.logger.log(`Role is not FARMER, skipping Stripe. Role received: "${dto.role}"`);
    }
    // ─────────────────────────────────────────────────────────────

    // 6. Save to DB (after Stripe so we have stripeAccountId ready)
    await this.usersService.create({
      keycloakId: keycloakUserId,
      email: dto.email,
      name: dto.lastName,
      role: dto.role,
      stripeAccountId,
    });

    this.logger.log(`Created user in database: ${dto.email}`);

    return {
      success: true,
      message: 'Account created successfully',
      user: { email: dto.email, role: dto.role },
      stripeOnboardingUrl,
    };

  } catch (error) {
    this.logger.error('Registration error:', error);
    if (error instanceof ConflictException) throw error;
    throw new BadRequestException(
      error.response?.data?.errorMessage || error.message || 'Failed to create account'
    );
  }
}

  /**
   * Syncs Keycloak user after login
   */
  async syncUser(keycloakPayload: any) {
    const { sub, email,name, realm_access } = keycloakPayload;
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
      name,
      role: role as UserRole,
    });

    this.logger.log(`Synced user: ${email}`);
    return { user: newUser, isNew: true };
  }

  getMe(keycloakId: string) {
    return this.usersService.findByKeycloakId(keycloakId);
  }
}