import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { DiscountTarget, DiscountType } from '@prisma/client';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async initializeOrderPayment(dto: {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    shippingAddress: string;
    items: { productId: string; quantity: number }[];
    shippingFee: number;
    couponCode?: string;
  }) {
    let subtotal = 0;
    const orderItemsData: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    const fetchedProducts: {
      id: string;
      price: number;
      quantity: number;
      categoryId: string;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          stockCount: true,
          categoryId: true,
        },
      });
      if (!product)
        throw new BadRequestException(`Product ${item.productId} not found.`);
      if (product.stockCount < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}.`,
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      fetchedProducts.push({
        id: product.id,
        price: product.price,
        quantity: item.quantity,
        categoryId: product.categoryId,
      });

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    let discountAmount = 0;
    let validCouponCode: string | null = null;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
        include: {
          products: { select: { id: true } },
          categories: { select: { id: true } },
        },
      });

      if (!coupon) {
        throw new BadRequestException('Invalid coupon code');
      }
      if (!coupon.isActive) {
        throw new BadRequestException('This coupon is currently inactive');
      }

      const now = new Date();
      if (coupon.startDate && now < coupon.startDate) {
        throw new BadRequestException('This coupon is not active yet.');
      }
      if (coupon.endDate && now > coupon.endDate) {
        throw new BadRequestException('This coupon has expired.');
      }

      validCouponCode = coupon.code;

      let eligibleSubtotal = 0;

      for (const fp of fetchedProducts) {
        if (coupon.target === DiscountTarget.ALL_PRODUCTS) {
          eligibleSubtotal += fp.price * fp.quantity;
        } else if (
          coupon.target === DiscountTarget.SPECIFIC_PRODUCTS &&
          coupon.products.some((p) => p.id === fp.id)
        ) {
          eligibleSubtotal += fp.price * fp.quantity;
        } else if (
          coupon.target === DiscountTarget.SPECIFIC_CATEGORIES &&
          coupon.categories.some((c) => c.id === fp.categoryId)
        ) {
          eligibleSubtotal += fp.price * fp.quantity;
        }
      }

      if (eligibleSubtotal > 0) {
        if (coupon.type === DiscountType.PERCENTAGE) {
          discountAmount = Math.floor(eligibleSubtotal * (coupon.value / 100));
        } else if (coupon.type === DiscountType.FLAT_FEE) {
          discountAmount = Math.min(eligibleSubtotal, coupon.value);
        }
      }

      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    const totalAmount = subtotal - discountAmount + dto.shippingFee;

    const reference = `ORD-${randomBytes(8).toString('hex').toUpperCase()}`;
    const email =
      dto.guestEmail ||
      (dto.userId
        ? (await this.prisma.user.findUnique({ where: { id: dto.userId } }))
            ?.email
        : null);

    if (!email)
      throw new BadRequestException('A valid email is required for checkout.');

    const order = await this.prisma.order.create({
      data: {
        reference,
        userId: dto.userId,
        guestName: dto.guestName,
        guestEmail: email,
        guestPhone: dto.guestPhone,
        shippingAddress: dto.shippingAddress,
        totalAmount,
        discountAmount,
        couponCode: validCouponCode,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
    });

    try {
      const frontendUrl =
        this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      const paystackResponse = await axios.post<PaystackInitResponse>(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: totalAmount * 100,
          reference: order.reference,
          callback_url: `${frontendUrl}/checkout/success?type=order`,
          metadata: { orderId: order.id, type: 'PRODUCT_ORDER' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        authorization_url: paystackResponse.data.data.authorization_url,
        reference: order.reference,
        orderId: order.id,
      };
    } catch (error: unknown) {
      this.logger.error('Paystack transaction initialization failed', error);
      throw new InternalServerErrorException(
        'Failed to initialize payment with Paystack.',
      );
    }
  }
}
