import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  sizes?: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
