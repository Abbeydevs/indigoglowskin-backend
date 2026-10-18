import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreateCategoryDto,
  CreateSpaServiceDto,
  UpdateCategoryDto,
  UpdateSpaServiceDto,
} from './dto/spa-service.dto';

@Injectable()
export class SpaServiceService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

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

  async createService(dto: CreateSpaServiceDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;

    if (file) {
      const result = await this.cloudinary.uploadImage(
        file.buffer,
        'treatments',
      );
      imageUrl = result.secure_url;
    }

    return this.prisma.spaService.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        categoryId: dto.categoryId,
        image: imageUrl,
      },
    });
  }

  async updateService(
    id: string,
    dto: UpdateSpaServiceDto,
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.spaService.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Treatment not found');
    }

    let imageUrl = dto.image || existing.image;

    if (file) {
      const result = await this.cloudinary.uploadImage(
        file.buffer,
        'treatments',
      );
      imageUrl = result.secure_url;
    }

    return this.prisma.spaService.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        categoryId: dto.categoryId,
        image: imageUrl,
      },
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
