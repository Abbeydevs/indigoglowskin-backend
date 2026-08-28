import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

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

    const newBooking = await this.prisma.booking.create({
      data: {
        userId: dto.userId,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        serviceId: dto.serviceId,
        date: bookingDate,
        startTime: start,
        endTime: end,
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    let clientName = dto.guestName || 'Guest Client';
    let clientEmail = dto.guestEmail || 'No Email';
    let clientPhone = dto.guestPhone || '';

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (user) {
        clientName = user.name || clientName;
        clientEmail = user.email || clientEmail;
        clientPhone = user.phone || clientPhone;
      }
    }

    void this.mailService.sendBookingNotificationEmail({
      clientName,
      clientEmail,
      clientPhone,
      serviceName: service.name,
      date: bookingDate.toISOString().split('T')[0],
      time: start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      notes: dto.notes,
    });

    return newBooking;
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { service: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async getAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        service: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        service: true,
        user: { select: { name: true, email: true } },
      },
    });

    const clientEmail: string | null =
      updatedBooking.user?.email ?? updatedBooking.guestEmail ?? null;
    const clientName: string =
      updatedBooking.user?.name ?? updatedBooking.guestName ?? 'Valued Client';

    if (
      typeof clientEmail === 'string' &&
      clientEmail.length > 0 &&
      (status === 'CONFIRMED' || status === 'CANCELLED')
    ) {
      void this.mailService.sendBookingStatusUpdateEmail({
        clientEmail,
        clientName,
        serviceName: updatedBooking.service.name,
        date: updatedBooking.date.toISOString().split('T')[0],
        time: updatedBooking.startTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status,
      });
    }

    return updatedBooking;
  }
}
