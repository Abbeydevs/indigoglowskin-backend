import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import {
  CreateShippingZoneDto,
  UpdateShippingZoneDto,
  UpdateShippingConfigDto,
} from './dto/shipping.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('zones')
  getZones() {
    return this.shippingService.getZones();
  }

  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createZone(@Body() dto: CreateShippingZoneDto) {
    return this.shippingService.createZone(dto);
  }

  @Patch('zones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateZone(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.shippingService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteZone(@Param('id') id: string) {
    return this.shippingService.deleteZone(id);
  }

  @Get('config')
  getConfig() {
    return this.shippingService.getConfig();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateConfig(@Body() dto: UpdateShippingConfigDto) {
    return this.shippingService.updateConfig(dto);
  }
}
