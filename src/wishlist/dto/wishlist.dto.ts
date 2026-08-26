import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleWishlistItemDto {
  @IsNotEmpty()
  @IsString()
  productId!: string;
}
