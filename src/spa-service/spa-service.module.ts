import { Module } from '@nestjs/common';
import { SpaServiceService } from './spa-service.service';
import { SpaServiceController } from './spa-service.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [SpaServiceService],
  controllers: [SpaServiceController],
})
export class SpaServiceModule {}
