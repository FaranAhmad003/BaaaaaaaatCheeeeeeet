import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { User } from '../users/entities/user.entity';
import { ChatGateWay } from './chat.gateway';
@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User]), // Include both Chat and User
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateWay],
})
export class ChatsModule {}
