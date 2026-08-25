import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import 'multer';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(dto: CreateProductDto, files?: Express.Multer.File[]) {
    let imageUrls: string[] = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinary.uploadImage(file.buffer, 'products'),
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map((result) => result.secure_url);
    }

    const sizesArray = dto.sizes
      ? dto.sizes
          .split(',')
          .map((size) => size.trim())
          .filter(Boolean)
      : [];

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        oldPrice: dto.oldPrice || null,
        stockCount: dto.stockCount || 0,
        categoryId: dto.categoryId,
        sizes: sizesArray,
        images: imageUrls,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    dto: Partial<CreateProductDto>,
    files?: Express.Multer.File[],
  ) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    let imageUrls: string[] = existing.images;

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinary.uploadImage(file.buffer, 'products'),
      );
      const uploadResults = await Promise.all(uploadPromises);
      const newUrls = uploadResults.map((result) => result.secure_url);
      imageUrls = [...imageUrls, ...newUrls];
    }

    const sizesArray = dto.sizes
      ? dto.sizes
          .split(',')
          .map((size) => size.trim())
          .filter(Boolean)
      : existing.sizes;

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name || existing.name,
        description: dto.description || existing.description,
        price: dto.price !== undefined ? Number(dto.price) : existing.price,
        oldPrice:
          dto.oldPrice !== undefined ? Number(dto.oldPrice) : existing.oldPrice,
        stockCount:
          dto.stockCount !== undefined
            ? Number(dto.stockCount)
            : existing.stockCount,
        isNew: dto.isNew !== undefined ? Boolean(dto.isNew) : existing.isNew,
        isBestSeller:
          dto.isBestSeller !== undefined
            ? Boolean(dto.isBestSeller)
            : existing.isBestSeller,
        categoryId: dto.categoryId || existing.categoryId,
        sizes: sizesArray,
        images: imageUrls,
      },
      include: { category: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product successfully deleted' };
  }

  async toggleNewStatus(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: { isNew: !product.isNew },
    });
  }

  async toggleBestSellerStatus(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: { isBestSeller: !product.isBestSeller },
    });
  }

  async searchProducts(query: string) {
    if (!query || query.trim() === '') {
      return [];
    }

    return this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: true,
      },
      take: 10,
    });
  }
}
