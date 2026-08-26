import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is missing!');
    }
    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'Indigoglowskin <support@thesoftwarehub.tech>',
        to,
        subject: 'Reset Your Password - Indigoglowskin',
        html: `
          <div style="font-family: sans-serif; color: #333; max-w-md; margin: auto;">
            <h2 style="font-weight: 300;">Reset Your Password</h2>
            <p style="font-weight: 300;">We received a request to reset your password. Click the link below to choose a new one:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; margin-top: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Reset Password</a>
            <p style="margin-top: 24px; font-size: 11px; color: #666;">This link expires in 15 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Email delivery failed: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during email delivery.',
      );
    }
  }

  async sendContactInquiryEmail(name: string, email: string, message: string) {
    try {
      await this.resend.emails.send({
        from: 'Indigoglowskin Contact Form <support@thesoftwarehub.tech>',
        to: 'abbey.developer@gmail.com',
        replyTo: email,
        subject: `New Inquiry from ${name}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-w-md; margin: auto;">
            <h2 style="font-weight: 300; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">New Contact Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 16px; margin-left: 0; white-space: pre-wrap;">
              ${message}
            </blockquote>
          </div>
        `,
      });
    } catch (error: unknown) {
      this.logger.error(
        'Failed to send contact inquiry email via Resend',
        error,
      );
    }
  }
}
