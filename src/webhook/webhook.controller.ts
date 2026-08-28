import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    [key: string]: unknown;
  };
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  @Post('paystack')
  async handlePaystackWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.error(
        'CRITICAL: PAYSTACK_SECRET_KEY is missing from environment variables.',
      );
      throw new InternalServerErrorException('Server configuration error');
    }

    const event = req.body as PaystackWebhookEvent;

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      this.logger.warn(
        'Invalid Paystack Webhook Signature detected. Possible spoofing attempt.',
      );
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid signature');
    }

    res.status(HttpStatus.OK).send();

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      try {
        const order = await this.prisma.order.findUnique({
          where: { reference },
          include: { items: { include: { product: true } } },
        });

        if (!order) {
          this.logger.error(`Order with reference ${reference} not found.`);
          return;
        }

        if (order.status !== 'PENDING') {
          this.logger.log(
            `Order ${order.id} is already processed. Ignoring duplicate webhook event.`,
          );
          return;
        }

        await this.prisma.$transaction(async (prisma) => {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'PAID' },
          });

          for (const item of order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stockCount: { decrement: item.quantity } },
            });
          }
        });

        const customerName = order.guestName ?? 'Valued Customer';
        const customerEmail = order.guestEmail ?? 'No Email';
        const mappedItems = order.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
        }));

        void this.mailService.sendOrderConfirmationEmail({
          orderId: order.id,
          customerEmail,
          customerName,
          totalAmount: order.totalAmount,
          items: mappedItems,
          shippingAddress: order.shippingAddress ?? 'Address not provided',
        });

        this.logger.log(
          `Order ${order.id} successfully verified, inventory deducted, and receipt sent.`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process webhook for reference ${reference}`,
          error,
        );
      }
    }
  }
}
