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
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
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
        discountPercentage: dto.discountPercentage,
        isActive: dto.isActive ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code?.toUpperCase(),
        discountPercentage: dto.discountPercentage,
        isActive: dto.isActive,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async deleteCoupon(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) throw new NotFoundException('Invalid coupon code.');
    if (!coupon.isActive)
      throw new BadRequestException('This coupon is currently inactive.');
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException('This coupon has expired.');
    }

    return {
      message: 'Coupon applied successfully!',
      discountPercentage: coupon.discountPercentage,
      code: coupon.code,
    };
  }
}
