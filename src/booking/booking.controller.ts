import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(dto);
  }

  @Get('user/:userId')
  getUserBookings(@Param('userId') userId: string) {
    return this.bookingService.getUserBookings(userId);
  }
}
