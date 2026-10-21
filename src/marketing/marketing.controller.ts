import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MarketingService } from './marketing.service';
import {
  UpdateBannerDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/marketing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('banner')
  getBanner() {
    return this.marketingService.getBanner();
  }

  @Post('validate-coupon')
  validateCoupon(@Body('code') code: string) {
    return this.marketingService.validateCoupon(code);
  }

  @Patch('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateBanner(@Body() dto: UpdateBannerDto) {
    return this.marketingService.updateBanner(dto);
  }

  @Get('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllCoupons() {
    return this.marketingService.getAllCoupons();
  }

  @Post('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.marketingService.createCoupon(dto);
  }

  @Patch('coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.marketingService.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCoupon(@Param('id') id: string) {
    return this.marketingService.deleteCoupon(id);
  }
}
