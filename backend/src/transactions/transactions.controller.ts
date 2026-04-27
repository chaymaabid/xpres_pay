// transactions/transactions.controller.ts
import {
  Controller, Post, Param, Req,
  UseInterceptors, UploadedFile,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/decorators/roles.decorator';
import { TransactionsService } from './transactions.service';
import { Public } from 'nest-keycloak-connect';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * POST /transactions/:orderId/proof-delivery
   * Farmer uploads proof of delivery → OCR check → returns matched boolean
   */
  @Post(':orderId/proof-delivery')
  @Roles('FARMER')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProof(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const keycloakId = req.user.sub;
    return this.transactionsService.verifyProofOfDelivery(orderId, file, keycloakId);
  }

  /**
   * POST /transactions/:orderId/release
   * Release locked funds to farmer via Stripe transfer
   */
  @Post(':orderId/release')
  @Roles('FARMER')
  async releaseFunds(
    @Param('orderId') orderId: string,
    @Req() req: any,
  ) {
    const keycloakId = req.user.sub;
    return this.transactionsService.releaseFunds(orderId, keycloakId);
  }
  @Get(':id/pod-url')
  async getPodUrl(@Param('id') id: string) {
    return this.transactionsService.getPodUrl(id);
  }

}