// src/messages/messages.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,

    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async sendMessage(senderId: string, dto: CreateMessageDto) {
    const { recipientEmail, content } = dto;

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if (!sender || !sender.isVerified) throw new ForbiddenException('Sender not verified');

    const recipient = await this.userRepo.findOne({ where: { email: recipientEmail } });
    if (!recipient || !recipient.isVerified) throw new NotFoundException('Recipient not found or not verified');

    let chat = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoin('chat.participants', 'user')
      .where('user.id IN (:...ids)', { ids: [sender.id, recipient.id] })
      .groupBy('chat.id')
      .having('COUNT(user.id) = 2')
      .getOne();

    if (!chat) {
      chat = this.chatRepo.create({ participants: [sender, recipient] });
      await this.chatRepo.save(chat);
    }

    const message = this.messageRepo.create({
      content,
      sender,
      chat,
    });
    return this.messageRepo.save(message);
    
    
  }

  async getReceivedMessages(userId: string) {
    return this.messageRepo.createQueryBuilder('message')
      .leftJoinAndSelect('message.chat', 'chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('participant.id = :userId', { userId })
      .andWhere('sender.id != :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }

  async getAllChatMessages(userId: string) {
    return this.messageRepo.createQueryBuilder('message')
      .leftJoinAndSelect('message.chat', 'chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('participant.id = :userId', { userId })
      .orderBy('message.createdAt', 'ASC')
      .getMany();
  }

  async getMessagesByChatId(chatId: string, userId: string) {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['participants', 'messages', 'messages.sender'],
    });

    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.participants.some(p => String(p.id) === String(userId))) {
      throw new ForbiddenException('Access denied');
    }

    return chat.messages.map((msg) => ({
      sender: msg.sender.email,
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  }

async getUserChatsWithLastMessage(userId: string) {
  const chats = await this.chatRepo
    .createQueryBuilder('chat')
    .leftJoinAndSelect('chat.participants', 'participant')
    .leftJoinAndSelect('chat.messages', 'message')
    .leftJoinAndSelect('message.sender', 'sender')
    .where(':userId = ANY (SELECT "usersId" FROM "chats_participants_users" WHERE "chatsId" = chat.id)', { userId })
    .getMany();

  const result = chats.map(chat => {
    try {
      const validMessages = Array.isArray(chat.messages)
        ? chat.messages.filter(msg => !!msg.createdAt)
        : [];

      const lastMessage = validMessages.length > 0
        ? validMessages.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null;

      const other = chat.participants.find(p => String(p.id) !== String(userId));

      const summary = {
        id: chat.id,
        name: other?.email || 'Unknown',
        email: other?.email || 'Unknown',
        lastMessage: lastMessage?.content || '',
        time: lastMessage?.createdAt || chat.createdAt,
        online: false,
      };

      return summary;
    } catch (err) {
      console.error(`❌ Error in chat ${chat.id}:`, err);
      return null;
    }
  });

  return result.filter(Boolean);
}


}
