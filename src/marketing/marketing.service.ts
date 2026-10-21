import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateBannerDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/marketing.dto';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async getBanner() {
    let banner = await this.prisma.promoBanner.findFirst();
    if (!banner) {
      banner = await this.prisma.promoBanner.create({
        data: { message: 'Welcome to Indigoglowskin!', isActive: false },
      });
    }
    return banner;
  }

  async updateBanner(dto: UpdateBannerDto) {
    const banner = await this.getBanner();
    return this.prisma.promoBanner.update({
      where: { id: banner.id },
      data: dto,
    });
  }

  async getAllCoupons() {
    return this.prisma.coupon.findMany({
      include: {
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(dto: CreateCouponDto) {
    const codeUpper = dto.code.toUpperCase();
    const existing = await this.prisma.coupon.findUnique({
      where: { code: codeUpper },
    });
    if (existing) throw new BadRequestException('Coupon code already exists.');

    return this.prisma.coupon.create({
      data: {
        code: codeUpper,
        type: dto.type,
        value: dto.value,
        target: dto.target,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        products: dto.productIds?.length
          ? { connect: dto.productIds.map((id) => ({ id })) }
          : undefined,
        categories: dto.categoryIds?.length
          ? { connect: dto.categoryIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { products: true, categories: true },
    });
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code?.toUpperCase(),
        type: dto.type,
        value: dto.value,
        target: dto.target,
        isActive: dto.isActive,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        products: dto.productIds
          ? { set: dto.productIds.map((id) => ({ id })) }
          : undefined,
        categories: dto.categoryIds
          ? { set: dto.categoryIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { products: true, categories: true },
    });
  }

  async deleteCoupon(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        products: { select: { id: true } },
        categories: { select: { id: true } },
      },
    });

    if (!coupon) throw new NotFoundException('Invalid coupon code.');
    if (!coupon.isActive)
      throw new BadRequestException('This coupon is currently inactive.');

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestException('This coupon is not active yet.');
    }
    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestException('This coupon has expired.');
    }

    return {
      message: 'Coupon applied successfully!',
      coupon,
    };
  }
}
