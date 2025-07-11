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

    // Check if a chat exists between the two users
    let chat = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoin('chat.participants', 'user')
      .where('user.id IN (:...ids)', { ids: [sender.id, recipient.id] })
      .groupBy('chat.id')
      .having('COUNT(user.id) = 2')
      .getOne();

    // If no chat exists, create one
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
    // Find all messages where the user is a participant but not the sender
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
}
