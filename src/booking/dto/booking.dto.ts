import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ValidateIf((o: CreateBookingDto) => !o.consultationId)
  @IsNotEmpty()
  @IsString()
  serviceId!: string;

  @ValidateIf((o: CreateBookingDto) => !o.serviceId)
  @IsNotEmpty()
  @IsString()
  consultationId?: string;

  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingStatusDto {
  @IsNotEmpty()
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
