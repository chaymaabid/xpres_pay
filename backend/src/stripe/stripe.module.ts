import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeController } from './stripe.controller';
import Stripe from 'stripe';

@Global()
@Module({
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
         const secretKey = configService.get<string>('STRIPE_SECRET_KEY');

        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined');
        }

        return new Stripe(secretKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['STRIPE_CLIENT'],
  controllers: [StripeController],
})
export class StripeModule {}