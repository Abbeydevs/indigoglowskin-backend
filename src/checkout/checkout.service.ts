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
  }) {
    let totalAmount = 0;
    const orderItemsData: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product)
        throw new BadRequestException(`Product ${item.productId} not found.`);
      if (product.stockCount < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}.`,
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

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
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
    });

    try {
      const paystackResponse = await axios.post<PaystackInitResponse>(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: totalAmount * 100,
          reference: order.reference,
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
