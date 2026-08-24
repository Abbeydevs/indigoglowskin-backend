import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [CloudinaryModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
