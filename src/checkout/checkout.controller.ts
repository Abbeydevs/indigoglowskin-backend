import { Controller, Post, Body } from '@nestjs/common';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('initialize')
  async initializePayment(
    @Body()
    dto: {
      userId?: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
      shippingAddress: string;
      items: { productId: string; quantity: number }[];
      shippingFee: number;
    },
  ) {
    return this.checkoutService.initializeOrderPayment(dto);
  }
}
