import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OrderStatus } from '@prisma/client'; // <-- Import the Enum

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const existingOrder = await this.prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const customerEmail =
      updatedOrder.guestEmail ?? updatedOrder.user?.email ?? '';
    const customerName =
      updatedOrder.guestName ?? updatedOrder.user?.name ?? 'Valued Customer';

    if (
      customerEmail.length > 0 &&
      ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)
    ) {
      void this.mailService.sendOrderStatusUpdateEmail({
        orderId: updatedOrder.id,
        customerEmail,
        customerName,
        status,
      });
    }

    return updatedOrder;
  }
}
