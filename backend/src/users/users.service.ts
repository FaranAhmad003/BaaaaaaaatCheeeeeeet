// users/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllUsersExcept(currentUserId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { id: Not(currentUserId) },
      select: ['id', 'email', 'isVerified', 'createdAt'], // only return safe fields
    });
  }
}
