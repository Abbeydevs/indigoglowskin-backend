import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitInquiryDto } from './dto/contact.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async submitInquiry(dto: SubmitInquiryDto) {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        name: dto.name,
        email: dto.email,
        message: dto.message,
        status: 'UNREAD',
      },
    });

    await this.mailService.sendContactInquiryEmail(
      dto.name,
      dto.email,
      dto.message,
    );

    return {
      success: true,
      message: 'Inquiry submitted successfully',
      inquiryId: inquiry.id,
    };
  }
}
