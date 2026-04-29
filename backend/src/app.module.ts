import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import {
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  AuthGuard,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KycModule } from './kyc/kyc.module';
import { StorageModule } from './storage/storage.module';
import { ProductsModule } from './products/products.module';
import { RolesGuard } from './common/guards/roles.guard';
import { TransactionsModule } from './transactions/transactions.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { StripeModule } from './stripe/stripe.module';
import { TransactionLedgerModule } from './transaction-ledger/transaction-ledger.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        authServerUrl: cfg.get<string>('KEYCLOAK_URL')!,
        realm: cfg.get<string>('KEYCLOAK_REALM')!,
        clientId: cfg.get<string>('KEYCLOAK_CLIENT_ID')!,
        secret: cfg.get<string>('KEYCLOAK_CLIENT_SECRET') || '', 
        loglevels: ['verbose'],
        tokenValidation: TokenValidation.OFFLINE,
    
    policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
        
      }),
    }),

    AuthModule,
    UsersModule,
    KycModule,
    StorageModule,
    ProductsModule,
    TransactionsModule,
    OrdersModule,
    OrderItemsModule,
    StripeModule,
    TransactionLedgerModule,
    NotificationModule
    
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}