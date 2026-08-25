import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import 'multer';

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(dto: CreateTestimonialDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;
    if (file) {
      const upload = await this.cloudinary.uploadImage(
        file.buffer,
        'testimonials',
      );
      imageUrl = upload.secure_url;
    }

    return this.prisma.testimonial.create({
      data: {
        customerName: dto.customerName,
        content: dto.content,
        rating: dto.rating ?? 5,
        productUsed: dto.productUsed || null,
        image: imageUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.testimonial.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }

  async update(
    id: string,
    dto: Partial<CreateTestimonialDto>,
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Testimonial not found');

    let imageUrl: string | null = existing.image;
    if (file) {
      const upload = await this.cloudinary.uploadImage(
        file.buffer,
        'testimonials',
      );
      imageUrl = upload.secure_url;
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: {
        customerName: dto.customerName || existing.customerName,
        content: dto.content || existing.content,
        // Fix: Explicitly cast the multipart string payload to a Number
        rating: dto.rating !== undefined ? Number(dto.rating) : existing.rating,
        productUsed:
          dto.productUsed !== undefined
            ? dto.productUsed
            : existing.productUsed,
        image: imageUrl,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Testimonial not found');

    await this.prisma.testimonial.delete({ where: { id } });
    return { message: 'Testimonial successfully deleted' };
  }
}
