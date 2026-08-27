import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  userId?: string;
  @IsNotEmpty()
  @IsString()
  serviceId!: string;

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
