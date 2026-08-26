import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { SubmitInquiryDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  submitInquiry(@Body() dto: SubmitInquiryDto) {
    return this.contactService.submitInquiry(dto);
  }
}
