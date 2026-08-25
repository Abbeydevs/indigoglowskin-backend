import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import 'multer';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('A category with this name already exists.');
    }

    let imageUrl: string | null = null;
    if (file) {
      const upload = await this.cloudinary.uploadImage(
        file.buffer,
        'categories',
      );
      imageUrl = upload.secure_url;
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        image: imageUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, name?: string, file?: Express.Multer.File) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    let imageUrl: string | null = category.image;
    if (file) {
      const upload = await this.cloudinary.uploadImage(
        file.buffer,
        'categories',
      );
      imageUrl = upload.secure_url;
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: name || category.name,
        image: imageUrl,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category successfully deleted' };
  }
}
