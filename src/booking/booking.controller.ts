import { Controller, Post, Get, Body, Param, Patch } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';

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

  @Get()
  getAllBookings() {
    return this.bookingService.getAllBookings();
  }

  @Patch(':id/status')
  updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateBookingStatus(id, dto.status);
  }
}
