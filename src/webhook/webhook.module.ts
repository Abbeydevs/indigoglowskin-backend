import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MailModule, PrismaModule, ConfigModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
