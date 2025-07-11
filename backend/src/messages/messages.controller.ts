import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // if using Passport JWT guard
declare module 'express' {
  interface Request {
    user?: any;
  }
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard) // optional: if protecting with JWT
  @Post('send')
  async sendMessage(@Body() createMessageDto: CreateMessageDto, @Req() req: Request) {
    console.log('req.user:', req.user);
    const senderId = req.user?.userId; // use userId as set by JwtStrategy
    const result = await this.messagesService.sendMessage(senderId, createMessageDto);
    return {
      message: 'Message sent successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('received')
  async getReceivedMessages(@Req() req: Request) {
    const userId = req.user?.userId;
    const messages = await this.messagesService.getReceivedMessages(userId);
    return { messages };
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllChatMessages(@Req() req: Request) {
    const userId = req.user?.userId;
    const messages = await this.messagesService.getAllChatMessages(userId);
    return { messages };
  }
  @Get('ping')
ping() {
  return { ok: true };
}
}
