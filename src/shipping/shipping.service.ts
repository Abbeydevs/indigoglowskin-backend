import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateShippingZoneDto,
  UpdateShippingZoneDto,
  UpdateShippingConfigDto,
} from './dto/shipping.dto';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async getZones() {
    return this.prisma.shippingZone.findMany({ orderBy: { name: 'asc' } });
  }

  async createZone(dto: CreateShippingZoneDto) {
    return this.prisma.shippingZone.create({ data: dto });
  }

  async updateZone(id: string, dto: UpdateShippingZoneDto) {
    return this.prisma.shippingZone.update({ where: { id }, data: dto });
  }

  async deleteZone(id: string) {
    return this.prisma.shippingZone.delete({ where: { id } });
  }

  async getConfig() {
    let config = await this.prisma.shippingConfig.findFirst();

    if (!config) {
      config = await this.prisma.shippingConfig.create({
        data: { baseWeight: 2.0, basePrice: 5000, extraWeightFee: 1000 },
      });
    }
    return config;
  }

  async updateConfig(dto: UpdateShippingConfigDto) {
    const config = await this.getConfig();
    return this.prisma.shippingConfig.update({
      where: { id: config.id },
      data: dto,
    });
  }
}
