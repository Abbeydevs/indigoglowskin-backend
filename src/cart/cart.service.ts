import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
    }

    let subtotal = 0;
    const formattedItems = cart.items.map((item) => {
      const isOutOfStock = item.product.stockCount === 0;
      const exceedsStock = item.quantity > item.product.stockCount;

      const availableQuantity = exceedsStock
        ? item.product.stockCount
        : item.quantity;

      if (!isOutOfStock) {
        subtotal += availableQuantity * item.product.price;
      }

      return {
        ...item,
        quantity: availableQuantity,
        isOutOfStock,
        exceedsStockRequested: exceedsStock,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: formattedItems,
      subtotal,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.stockCount < dto.quantity) {
      throw new BadRequestException(
        `Only ${product.stockCount} units available in stock.`,
      );
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (newQuantity > product.stockCount) {
        throw new BadRequestException(
          `Cannot add more. Only ${product.stockCount} units available.`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item) throw new NotFoundException('Cart item not found');
    if (dto.quantity > item.product.stockCount) {
      throw new BadRequestException(
        `Only ${item.product.stockCount} units available.`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
    return this.getCart(userId);
  }
}
