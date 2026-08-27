import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { SpaServiceService } from './spa-service.service';
import {
  CreateCategoryDto,
  CreateSpaServiceDto,
  UpdateCategoryDto,
  UpdateSpaServiceDto,
} from './dto/spa-service.dto';

@Controller('spa-services')
export class SpaServiceController {
  constructor(private readonly spaServiceService: SpaServiceService) {}

  @Get()
  getAllServices() {
    return this.spaServiceService.getAllServicesGrouped();
  }

  @Post('category')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.spaServiceService.createCategory(dto);
  }

  @Patch('category/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.spaServiceService.updateCategory(id, dto);
  }

  @Post()
  createService(@Body() dto: CreateSpaServiceDto) {
    return this.spaServiceService.createService(dto);
  }

  @Patch(':id')
  updateService(@Param('id') id: string, @Body() dto: UpdateSpaServiceDto) {
    return this.spaServiceService.updateService(id, dto);
  }

  @Delete(':id')
  deleteService(@Param('id') id: string) {
    return this.spaServiceService.deleteService(id);
  }

  @Delete('category/:id')
  deleteCategory(@Param('id') id: string) {
    return this.spaServiceService.deleteCategory(id);
  }
}
