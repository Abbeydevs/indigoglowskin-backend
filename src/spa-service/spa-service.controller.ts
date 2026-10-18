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
import { FileInterceptor } from '@nestjs/platform-express';
import { SpaServiceService } from './spa-service.service';
import {
  CreateCategoryDto,
  CreateSpaServiceDto,
  UpdateCategoryDto,
  UpdateSpaServiceDto,
} from './dto/spa-service.dto';
import 'multer';

@Controller('spa-services')
export class SpaServiceController {
  constructor(private readonly spaServiceService: SpaServiceService) {}

  @Get()
  getAllServices() {
    return this.spaServiceService.getAllServicesGrouped();
  }

  @Post('category')
  @UseInterceptors(FileInterceptor('image'))
  createCategory(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.spaServiceService.createCategory(dto, file);
  }

  @Patch('category/:id')
  @UseInterceptors(FileInterceptor('image'))
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.spaServiceService.updateCategory(id, dto, file);
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
