import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import 'multer';

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.blog.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async create(dto: CreateBlogDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;
    if (file) {
      const upload = await this.cloudinary.uploadImage(file.buffer, 'blogs');
      imageUrl = upload.secure_url;
    }

    const slug = await this.generateUniqueSlug(dto.title);

    return this.prisma.blog.create({
      data: {
        title: dto.title,
        slug,
        category: dto.category,
        excerpt: dto.excerpt,
        content: dto.content,
        authorName: dto.authorName || 'Indigoglowskin Experts',
        image: imageUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async findBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({ where: { slug } });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async update(
    id: string,
    dto: Partial<CreateBlogDto>,
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.blog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Blog post not found');

    let imageUrl: string | null = existing.image;
    if (file) {
      const upload = await this.cloudinary.uploadImage(file.buffer, 'blogs');
      imageUrl = upload.secure_url;
    }

    return this.prisma.blog.update({
      where: { id },
      data: {
        title: dto.title || existing.title,
        category: dto.category || existing.category,
        excerpt: dto.excerpt || existing.excerpt,
        content: dto.content || existing.content,
        authorName: dto.authorName || existing.authorName,
        image: imageUrl,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.blog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Blog post not found');

    await this.prisma.blog.delete({ where: { id } });
    return { message: 'Blog post successfully deleted' };
  }
}
