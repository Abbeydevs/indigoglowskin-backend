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

  private getAdminEmail(): string {
    const email = this.config.get<string>('ADMIN_EMAIL');
    if (!email) {
      this.logger.warn(
        'ADMIN_EMAIL is not set in .env. Falling back to default.',
      );
      return 'support@thesoftwarehub.tech';
    }
    return email;
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
        to: this.getAdminEmail(),
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

  async sendBookingNotificationEmail(details: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    serviceName: string;
    date: string;
    time: string;
    notes?: string;
  }) {
    try {
      await this.resend.emails.send({
        from: 'Indigoglowskin Bookings <support@thesoftwarehub.tech>',
        to: this.getAdminEmail(),
        subject: `New Booking Request: ${details.serviceName}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-w-md; margin: auto;">
            <h2 style="font-weight: 300; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">New Reservation Request</h2>
            <p><strong>Client:</strong> ${details.clientName}</p>
            <p><strong>Email:</strong> ${details.clientEmail}</p>
            <p><strong>Phone:</strong> ${details.clientPhone || 'Not provided'}</p>
            <p><strong>Service:</strong> ${details.serviceName}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Time:</strong> ${details.time}</p>
            ${details.notes ? `<blockquote style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 16px; margin-top: 16px;"><strong>Notes:</strong><br/>${details.notes}</blockquote>` : ''}
            <p style="margin-top: 24px; font-size: 11px; color: #666;">Log in to the admin dashboard to confirm or cancel this request.</p>
          </div>
        `,
      });
    } catch (error: unknown) {
      this.logger.error(
        'Failed to send company booking notification email',
        error,
      );
    }
  }

  async sendBookingStatusUpdateEmail(details: {
    clientEmail: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    status: string;
  }) {
    let subject = '';
    let message = '';
    let color = '#333';

    if (details.status === 'CONFIRMED') {
      subject = `Booking Confirmed: ${details.serviceName}`;
      message = `Great news, ${details.clientName}! Your session for <strong>${details.serviceName}</strong> has been officially confirmed by our clinic. We look forward to seeing you.`;
      color = '#166534';
    } else if (details.status === 'CANCELLED') {
      subject = `Booking Cancelled: ${details.serviceName}`;
      message = `Hello ${details.clientName}, unfortunately, we had to reject or cancel your session request for <strong>${details.serviceName}</strong>. Please contact us if you need to reschedule or require more information.`;
      color = '#991b1b';
    } else {
      return;
    }

    try {
      await this.resend.emails.send({
        from: 'Indigoglowskin <support@thesoftwarehub.tech>',
        to: details.clientEmail,
        subject,
        html: `
          <div style="font-family: sans-serif; color: #333; max-w-md; margin: auto;">
            <h2 style="font-weight: 300; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; color: ${color};">
              Reservation ${details.status}
            </h2>
            <p style="line-height: 1.6;">${message}</p>
            <div style="background-color: #f9f9f9; border: 1px solid #eaeaea; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${details.serviceName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${details.date}</p>
              <p style="margin: 0;"><strong>Time:</strong> ${details.time}</p>
            </div>
          </div>
        `,
      });
    } catch (error: unknown) {
      this.logger.error(
        'Failed to send customer booking status update email',
        error,
      );
    }
  }

  async sendOrderStatusUpdateEmail(details: {
    orderId: string;
    customerEmail: string;
    customerName: string;
    status: string;
  }) {
    const statusMessages: Record<string, string> = {
      PROCESSING:
        'We are currently packing your order and getting it ready for shipment.',
      SHIPPED:
        'Great news! Your order has been handed over to our delivery partners and is on its way to you.',
      DELIVERED:
        'Your order has been marked as delivered. Enjoy your IndigoGlowSkin products!',
    };

    await this.resend.emails.send({
      from: 'Indigoglowskin Tracking <support@thesoftwarehub.tech>',
      to: details.customerEmail,
      subject: `Order Update: Your package is ${details.status.toLowerCase()}`,
      html: `<h2>Order Update: #${details.orderId.slice(0, 8).toUpperCase()}</h2>
             <p>Hello ${details.customerName},</p>
             <p>${statusMessages[details.status] || 'Your order status has been updated.'}</p>`,
    });
  }

  async sendOrderConfirmationEmail(details: {
    orderId: string;
    customerEmail: string;
    customerName: string;
    totalAmount: number;
    items: { name: string; quantity: number; price: number }[];
    shippingAddress: string;
  }) {
    const itemsHtml = details.items
      .map(
        (item) =>
          `<li style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            <strong>${item.quantity}x ${item.name}</strong><br/>
            <span style="color: #666; font-size: 12px;">₦${item.price.toLocaleString()}</span>
          </li>`,
      )
      .join('');

    try {
      await this.resend.emails.send({
        from: 'Indigoglowskin Orders <support@thesoftwarehub.tech>',
        to: details.customerEmail,
        subject: `Order Confirmed: #${details.orderId.slice(0, 8).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-w-md; margin: auto;">
            <h2 style="font-weight: 300;">Thank you for your order, ${details.customerName}!</h2>
            <p>We have received your payment of <strong>₦${details.totalAmount.toLocaleString()}</strong>.</p>
            <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 24px;">Order Summary</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${itemsHtml}
            </ul>
            <p style="margin-top: 24px; font-size: 13px;"><strong>Shipping To:</strong><br/>${details.shippingAddress}</p>
          </div>
        `,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to send customer order email', error);
    }

    try {
      await this.resend.emails.send({
        from: 'Indigoglowskin Alerts <support@thesoftwarehub.tech>',
        to: this.getAdminEmail(),
        subject: `ACTION REQUIRED: New Order #${details.orderId.slice(0, 8).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-w-md; margin: auto;">
            <h2 style="font-weight: 300; color: #166534;">Payment Received</h2>
            <p><strong>${details.customerName}</strong> (${details.customerEmail}) just paid <strong>₦${details.totalAmount.toLocaleString()}</strong>.</p>
            <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 24px;">Items to Pack:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${itemsHtml}
            </ul>
            <div style="background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 16px; margin-top: 24px;">
              <p style="margin: 0;"><strong>Deliver To:</strong><br/>${details.shippingAddress}</p>
            </div>
            <p style="margin-top: 24px; font-size: 11px; color: #666;">Log in to the dashboard to update the status to PROCESSING.</p>
          </div>
        `,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to send company order email', error);
    }
  }
}
