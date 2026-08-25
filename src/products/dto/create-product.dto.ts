import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stockCount?: number;

  @IsOptional()
  @IsString()
  sizes?: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isBestSeller?: boolean;
}
