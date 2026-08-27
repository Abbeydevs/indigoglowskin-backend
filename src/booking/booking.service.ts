import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(dto: CreateBookingDto) {
    const service = await this.prisma.spaService.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(
        'The requested spa service could not be found.',
      );
    }

    const start = new Date(dto.startTime);
    const end = new Date(start.getTime() + service.duration * 60000);
    const bookingDate = new Date(dto.date);

    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        serviceId: dto.serviceId,
        status: { not: 'CANCELLED' },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlappingBookings.length > 0) {
      throw new BadRequestException(
        'This time slot is already booked for this specific service. Please select another time.',
      );
    }

    return this.prisma.booking.create({
      data: {
        userId: dto.userId,
        serviceId: dto.serviceId,
        date: bookingDate,
        startTime: start,
        endTime: end,
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { service: true },
      orderBy: { startTime: 'desc' },
    });
  }
}
