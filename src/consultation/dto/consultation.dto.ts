import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateConsultationDto {
  @IsNotEmpty()
  @IsString()
  format!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class UpdateConsultationDto {
  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}
