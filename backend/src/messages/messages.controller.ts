import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // if using Passport JWT guard
import { MessagesGateway } from './messages.gateway';
import { Param } from '@nestjs/common';
declare module 'express' {
  interface Request {
    user?: any;
  }
}

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('send')
  async sendMessage(@Body() createMessageDto: CreateMessageDto, @Req() req: Request) {
    const senderId = req.user?.userId;
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

  // ✅ ADD THIS ABOVE @Get(':chatId')
 @UseGuards(JwtAuthGuard)
  @Get('chat-summaries')
  async getUserChatsWithLastMessage(@Req() req: Request) {
    const userId = req.user?.userId;
    const summaries = await this.messagesService.getUserChatsWithLastMessage(userId);
    return { chats: summaries };
  }

  // 👇 MUST BE LAST to avoid conflicts with other routes
  @UseGuards(JwtAuthGuard)
  @Get(':chatId')
  async getMessagesByChatId(@Param('chatId') chatId: string, @Req() req: Request) {
    const userId = req.user?.userId;
    const messages = await this.messagesService.getMessagesByChatId(chatId, userId);
    return { messages };
  }
}

