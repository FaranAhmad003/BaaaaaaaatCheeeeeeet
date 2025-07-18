import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { Chat } from './chats/entities/chat.entity';
import { ChatsModule } from './chats/chats.module';
import { Message } from './messages/entities/message.entity';
import { MessagesModule } from './messages/messages.module';
import { ChatGateWay } from './chats/chat.gateway';
import { MessagesGateway } from './messages/messages.gateway';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Loads .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Chat, Message],
      synchronize: true,
    }),
    AuthModule,
    ChatsModule,
    MessagesModule,
    ChatGateWay,
    MessagesGateway,
    UsersModule,


  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
