import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SpaServiceService } from './spa-service.service';
import {
  CreateCategoryDto,
  CreateSpaServiceDto,
  UpdateCategoryDto,
  UpdateSpaServiceDto,
} from './dto/spa-service.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('image'))
  createService(
    @Body() dto: CreateSpaServiceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.spaServiceService.createService(dto, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  updateService(
    @Param('id') id: string,
    @Body() dto: UpdateSpaServiceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.spaServiceService.updateService(id, dto, file);
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
