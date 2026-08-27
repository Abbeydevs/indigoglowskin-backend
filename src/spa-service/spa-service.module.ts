import { Module } from '@nestjs/common';
import { SpaServiceService } from './spa-service.service';
import { SpaServiceController } from './spa-service.controller';

@Module({
  providers: [SpaServiceService],
  controllers: [SpaServiceController]
})
export class SpaServiceModule {}
