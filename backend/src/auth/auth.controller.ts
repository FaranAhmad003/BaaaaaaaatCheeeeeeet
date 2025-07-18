import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user || !user.isVerified) {
      throw new BadRequestException('OTP not verified or user not found');
    }

    if (user.password) {
      throw new BadRequestException('User already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    user.password = hashedPassword;
    await this.userRepo.save(user);

    return { message: 'Signup successful' };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user || !user.password) {
      throw new BadRequestException('User not found or password not set');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
  @UseGuards(JwtAuthGuard)
  @Get('users/others')
  async getOtherUsers(@Req() req) {
    const currentUserId = req.user.id;
    const users = await this.userRepo.find({
      where: { id: Not(currentUserId) },
      select: ['id', 'email', 'isVerified', 'createdAt'],
    });
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/all')
  async getAllUserEmails(@Req() req) {
    const currentEmail = req.user.email;
    const users = await this.userRepo.find({ select: ['email'] });
    return users.filter(u => u.email !== currentEmail);
  }
}
