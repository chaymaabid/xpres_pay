import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { Request } from 'express';
import Stripe from 'stripe';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Regenerate an onboarding link if it expired
   * Called by /auth/stripe/refresh frontend page
   */
  @Post('onboarding-link')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh a Stripe Express onboarding link' })
  async refreshOnboardingLink(@Body() body: { accountId: string }) {
    if (!body.accountId) {
      throw new BadRequestException('accountId is required');
    }

    try {
      const link = await this.stripe.accountLinks.create({
        account: body.accountId,
        refresh_url: `${this.configService.get('FRONTEND_URL')}/auth/stripe/refresh?accountId=${body.accountId}`,
        return_url: `${this.configService.get('FRONTEND_URL')}/auth/stripe/complete`,
        type: 'account_onboarding',
      });

      this.logger.log(`Regenerated onboarding link for account: ${body.accountId}`);
      return { url: link.url };

    } catch (error) {
      this.logger.error(`Failed to regenerate onboarding link: ${error.message}`);
      throw new BadRequestException('Failed to generate onboarding link');
    }
  }

  /**
   * Stripe webhook endpoint
   * Stripe signs every request — we verify the signature before processing
   * IMPORTANT: this route needs raw body (not parsed JSON) for signature verification
   */
  
}