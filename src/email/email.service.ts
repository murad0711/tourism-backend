import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendLoginOtpEmail(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: 'Login Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>You've requested to log in. Please use the verification code below to complete your login.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Verification Code:</h3>
            <p style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; margin: 10px 0;">${otp}</p>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't attempt to log in, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetOtpEmail(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.configService.get<string>(
        'MAIL_FROM_NAME',
      )}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: 'Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the code below to proceed.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Reset Code:</h3>
            <p style="font-size: 32px; font-weight: bold; color: #FF5722; letter-spacing: 5px; margin: 10px 0;">${otp}</p>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      `,
    });
  }

  async sendInvitationEmail(
    email: string,
    firstName: string,
    password: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.configService.get<string>(
        'MAIL_FROM_NAME',
      )}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: 'Welcome to Aliv Digital — Your Account has been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Aliv Digital, ${firstName}!</h1>
          <p>Your administrative account has been created by the system administrator.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          
          <p>You can now log in to the portal using these credentials. You will be asked to verify your email through an OTP during your first login.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            The Aliv Digital Team
          </p>
        </div>
      `,
    });
  }
}
