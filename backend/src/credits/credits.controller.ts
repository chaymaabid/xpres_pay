import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator'
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/credits.dto';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('setup-intent')
  @Roles('RETAILER')
  createSetupIntent(@Req() req: any) {
    return this.creditsService.createSetupIntent(req.user.sub);
  }

  @Get('payment-method')
  @Roles('RETAILER')
  getSavedCard(@Req() req: any) {
    return this.creditsService.getSavedPaymentMethod(req.user.sub);
  }

  @Post()
  @Roles('RETAILER')
  createCredit(@Body() dto: CreateCreditDto, @Req() req: any) {
    return this.creditsService.createCredit(dto, req.user.sub);
  }
  
  @Post(':id/cancel')
  @Roles('RETAILER')
  cancelCredit(@Param('id') id: string, @Req() req: any) { 
    return this.creditsService.cancelCredit(id, req.user.sub);
  }

  @Post(':id/accept')
  @Roles('FARMER')
  acceptCredit(@Param('id') id: string, @Req() req: any) {
    return this.creditsService.acceptCredit(id, req.user.sub);
  }

  @Post(':id/reject')
  @Roles('FARMER')
  rejectCredit(@Param('id') id: string, @Req() req: any) {
    return this.creditsService.rejectCredit(id, req.user.sub);
  }

  @Get('my-offers')
  @Roles('RETAILER')
  getMyOffers(@Req() req: any) {
    return this.creditsService.getRetailerCredits(req.user.sub);
  }
  
  @Get('marketplace')
  @Roles('RETAILER')
  getMarketplace(@Req() req: any) {
    return this.creditsService.getMarketplace(req.user.sub);
  }
  
  @Get('farmer/all')
  @Roles('FARMER')
  getFarmerAll(@Req() req: any) {
    return this.creditsService.getFarmerAllCredits(req.user.sub);
  }
  @Get('farmer/pending')
  @Roles('FARMER')
  getFarmerPending(@Req() req: any) {
    return this.creditsService.getFarmerPendingCredits(req.user.sub);
  }
}