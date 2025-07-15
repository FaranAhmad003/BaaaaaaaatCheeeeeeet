import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async requestOtp(email: string): Promise<{ message: string }> {
    const otpSecret = speakeasy.generateSecret({ length: 20 });

    const otp = speakeasy.totp({
      secret: otpSecret.base32,
      encoding: 'base32',
      step: 30, // ⏱ make explicit
    });

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your ChatApp OTP Code',
      text: `Your OTP code is: ${otp}`,
    });

    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({ email, otpSecret: otpSecret.base32 });
    } else {
      user.otpSecret = otpSecret.base32;
    }
    await this.userRepo.save(user);

    return { message: 'OTP sent to your email' };
  }

  async verifyOtp(email: string, otp: string): Promise<{ verified: boolean }> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || !user.otpSecret) {
      return { verified: false };
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: 'base32',
      token: otp,
      step: 30,
      window: 2,
    });

    if (isVerified) {
      user.isVerified = true;
      await this.userRepo.save(user);
    }

    return { verified: isVerified };
  }
}
