import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistItemDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() req: AuthenticatedRequest) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post('toggle')
  toggleItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToggleWishlistItemDto,
  ) {
    return this.wishlistService.toggleItem(req.user.id, dto);
  }
}
