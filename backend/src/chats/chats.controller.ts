import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  async startChat(
    @Body('targetEmail') targetEmail: string,
    @Request() req,
  ) {
    const requestingUserId = req.user.sub; // extracted from JWT
    const chat = await this.chatsService.startChat(requestingUserId, targetEmail);

    return {
      message: 'Chat started',
      chat: {
        id: chat.id,
        participants: chat.participants.map((u) => ({ id: u.id, email: u.email })),
        createdAt: chat.createdAt,
      },
    };
  }
  
}
