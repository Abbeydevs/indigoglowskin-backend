import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
} from './dto/consultation.dto';

@Injectable()
export class ConsultationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConsultationDto) {
    return this.prisma.consultation.create({
      data: {
        format: dto.format,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        duration: dto.duration ?? 30,
      },
    });
  }

  async findAll() {
    return this.prisma.consultation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }
    return consultation;
  }

  async update(id: string, dto: UpdateConsultationDto) {
    return this.prisma.consultation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.consultation.delete({
      where: { id },
    });
  }
}
