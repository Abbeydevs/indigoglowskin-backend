import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateSpaServiceDto,
  UpdateCategoryDto,
  UpdateSpaServiceDto,
} from './dto/spa-service.dto';

@Injectable()
export class SpaServiceService {
  constructor(private prisma: PrismaService) {}

  async getAllServicesGrouped() {
    return this.prisma.serviceCategory.findMany({
      include: {
        services: true,
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: { name: dto.name },
    });
  }

  async createService(dto: CreateSpaServiceDto) {
    return this.prisma.spaService.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        categoryId: dto.categoryId,
      },
    });
  }

  async updateService(id: string, dto: UpdateSpaServiceDto) {
    return this.prisma.spaService.update({
      where: { id },
      data: dto,
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteService(id: string) {
    return this.prisma.spaService.delete({
      where: { id },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }
}
