import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_USER !== 'your_smtp_user') {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          },
        });
        this.isConfigured = true;
      } catch (err) {
        logger.warn('[EmailService] SMTP transporter initialization failed, falling back to development logger.');
      }
    } else {
      logger.info('[EmailService] SMTP credentials not set or using placeholders. Operating in development safe-logging mode.');
    }
  }

  async sendEmail({ to, subject, html, text }: EmailPayload): Promise<boolean> {
    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject,
          html,
          text,
        });
        logger.info(`[EmailService] Email sent successfully to ${to} with subject: "${subject}"`);
        return true;
      } catch (err: any) {
        logger.error(`[EmailService] Failed to send email via SMTP to ${to}:`, err?.message || err);
        // Do not crash the application
        return false;
      }
    }

    // Safe development console logger
    logger.info(`[EmailNotification - DEV MODE]
    --------------------------------------------------
    To: ${to}
    From: ${env.EMAIL_FROM}
    Subject: ${subject}
    Message: ${text}
    --------------------------------------------------`);
    return true;
  }

  async sendBookingConfirmation(
    to: string,
    guestName: string,
    bookingRef: string,
    hotelName: string,
    checkIn: string,
    checkOut: string,
    total: number
  ) {
    const subject = `Booking Confirmed: ${bookingRef} — ${hotelName}`;
    const text = `Dear ${guestName},\n\nYour reservation at ${hotelName} is confirmed!\n\nBooking Reference: ${bookingRef}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nTotal Amount Paid: $${total.toFixed(2)}\n\nThank you for choosing StayEase. We look forward to welcoming you!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f2438; margin-bottom: 8px;">StayEase — Reservation Confirmed</h2>
        <p style="color: #64748b; font-size: 14px;">We are delighted to confirm your upcoming stay.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Booking Reference:</strong> <span style="color: #059669; font-weight: bold;">${bookingRef}</span></p>
          <p><strong>Hotel:</strong> ${hotelName}</p>
          <p><strong>Check-in:</strong> ${checkIn}</p>
          <p><strong>Check-out:</strong> ${checkOut}</p>
          <p><strong>Total Amount:</strong> $${total.toFixed(2)} USD</p>
        </div>
        <p>You can manage your reservation anytime through your StayEase Customer Dashboard.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">StayEase Luxury Hospitality Group &bull; All Rights Reserved</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html, text });
  }

  async sendCancellationConfirmation(
    to: string,
    guestName: string,
    bookingRef: string,
    hotelName: string,
    refundAmount: number
  ) {
    const subject = `Booking Cancelled: ${bookingRef} — ${hotelName}`;
    const text = `Dear ${guestName},\n\nYour reservation ${bookingRef} at ${hotelName} has been cancelled as requested.\nRefund processed: $${refundAmount.toFixed(2)}.\n\nWe hope to welcome you another time.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f2438;">StayEase — Booking Cancellation</h2>
        <p>Dear ${guestName},</p>
        <p>Your reservation <strong>${bookingRef}</strong> at <strong>${hotelName}</strong> has been cancelled.</p>
        <div style="background: #fef2f2; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;">Refund status: <strong>$${refundAmount.toFixed(2)} USD</strong> refunded in accordance with the hotel cancellation policy.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">StayEase Luxury Hospitality Group</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html, text });
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const subject = 'StayEase — Password Reset Request';
    const text = `You requested a password reset for your StayEase account.\nPlease visit the following link within 1 hour to choose a new password:\n${resetLink}\n\nIf you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f2438;">Password Reset Request</h2>
        <p>You recently requested to reset your password for your StayEase account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="background: #0f2438; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Your Password
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you did not make this request, your account remains secure and no action is required.</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html, text });
  }
}

export const emailService = new EmailService();
