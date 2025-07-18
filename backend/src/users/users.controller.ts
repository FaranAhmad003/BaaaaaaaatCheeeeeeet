// users/user.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // adjust import as per your path

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('others')
  async getOtherUsers(@Req() req) {
    console.log('Authenticated Uer: ', req.user);
    const currentUserId = req.user.id;
    return this.userService.getAllUsersExcept(currentUserId);
  }
}
