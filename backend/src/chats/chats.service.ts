import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async startChat(requestingUserId: string, targetEmail: string): Promise<Chat> {
    const targetUser = await this.userRepo.findOne({ where: { email: targetEmail } });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const requestingUser = await this.userRepo.findOne({ where: { id: requestingUserId } });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    // Check if a chat between both users already exists
    const existingChat = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .where('participant.id IN (:...ids)', { ids: [requestingUserId, targetUser.id] })
      .groupBy('chat.id')
      .having('COUNT(participant.id) = 2')
      .getOne();

    if (existingChat) {
      return existingChat;
    }

    // Create a new chat
    const chat = this.chatRepo.create({
      participants: [requestingUser, targetUser],
    });

    return await this.chatRepo.save(chat);
  }
}
