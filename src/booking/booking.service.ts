import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import axios from 'axios';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    if (!dto.serviceId && !dto.consultationId) {
      throw new BadRequestException(
        'You must provide either a serviceId or a consultationId.',
      );
    }

    let duration = 0;
    let price = 0;
    let bookedItemName = '';

    if (dto.serviceId) {
      const service = await this.prisma.spaService.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service)
        throw new NotFoundException(
          'The requested treatment could not be found.',
        );
      duration = service.duration;
      price = service.price;
      bookedItemName = service.name;
    } else if (dto.consultationId) {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: dto.consultationId },
      });
      if (!consultation)
        throw new NotFoundException(
          'The requested consultation could not be found.',
        );
      duration = consultation.duration;
      price = consultation.price;
      bookedItemName = consultation.name;
    }

    const start = new Date(dto.startTime);
    const end = new Date(start.getTime() + duration * 60000);
    const bookingDate = new Date(dto.date);

    const overlapFilter = dto.serviceId
      ? { serviceId: dto.serviceId }
      : { consultationId: dto.consultationId };

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        ...overlapFilter,
        status: { not: 'CANCELLED' },
        startTime: { lt: end },
        endTime: { gt: start },
        OR: [{ isPaid: true }, { createdAt: { gte: fifteenMinutesAgo } }],
      },
    });

    if (overlappingBookings.length > 0) {
      throw new BadRequestException(
        'This time slot is already booked for this specific service. Please select another time.',
      );
    }

    let clientEmail = dto.guestEmail || null;
    let clientName = dto.guestName || 'Guest Client';
    let clientPhone = dto.guestPhone || '';

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (user) {
        clientEmail = user.email || clientEmail;
        clientName = user.name || clientName;
        clientPhone = user.phone || clientPhone;
      }
    }

    if (!clientEmail) {
      throw new BadRequestException(
        'A valid email is required to process the booking payment.',
      );
    }

    const reference = `BKG-${randomBytes(8).toString('hex').toUpperCase()}`;

    const newBooking = await this.prisma.booking.create({
      data: {
        userId: dto.userId,
        guestName: clientName,
        guestEmail: clientEmail,
        guestPhone: clientPhone,
        serviceId: dto.serviceId,
        consultationId: dto.consultationId,
        date: bookingDate,
        startTime: start,
        endTime: end,
        notes: dto.notes,
        status: 'PENDING',
        isPaid: false,
        reference,
      },
    });

    try {
      const frontendUrl =
        this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      const paystackResponse = await axios.post<PaystackInitResponse>(
        'https://api.paystack.co/transaction/initialize',
        {
          email: clientEmail,
          amount: price * 100,
          reference: newBooking.reference,
          callback_url: `${frontendUrl}/checkout/success?type=booking`,
          metadata: {
            bookingId: newBooking.id,
            type: 'CLINIC_BOOKING',
            itemName: bookedItemName,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        authorization_url: paystackResponse.data.data.authorization_url,
        reference: newBooking.reference,
        bookingId: newBooking.id,
      };
    } catch (error: unknown) {
      this.logger.error(
        'Paystack transaction initialization failed for booking',
        error,
      );
      await this.prisma.booking.delete({ where: { id: newBooking.id } });
      throw new InternalServerErrorException(
        'Failed to initialize payment with Paystack.',
      );
    }
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId, isPaid: true },
      include: {
        service: true,
        consultation: true,
        user: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        service: true,
        consultation: true,
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
        consultation: true,
        user: { select: { name: true, email: true } },
      },
    });

    const clientEmail: string | null =
      updatedBooking.user?.email ?? updatedBooking.guestEmail ?? null;
    const clientName: string =
      updatedBooking.user?.name ?? updatedBooking.guestName ?? 'Valued Client';

    const bookedItemName =
      updatedBooking.service?.name ??
      updatedBooking.consultation?.name ??
      'Clinic Session';

    if (
      typeof clientEmail === 'string' &&
      clientEmail.length > 0 &&
      (status === 'CONFIRMED' || status === 'CANCELLED')
    ) {
      void this.mailService.sendBookingStatusUpdateEmail({
        clientEmail,
        clientName,
        serviceName: bookedItemName,
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

  async getTakenSlots(
    date: string,
    serviceId?: string,
    consultationId?: string,
  ) {
    if (!date) return [];

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const overlapFilter = serviceId ? { serviceId } : { consultationId };

    const bookings = await this.prisma.booking.findMany({
      where: {
        ...overlapFilter,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        OR: [{ isPaid: true }, { createdAt: { gte: fifteenMinutesAgo } }],
      },
      select: { startTime: true },
    });

    return bookings.map((b) => {
      const hrs = b.startTime.getHours().toString().padStart(2, '0');
      const mins = b.startTime.getMinutes().toString().padStart(2, '0');
      return `${hrs}:${mins}`;
    });
  }
}
