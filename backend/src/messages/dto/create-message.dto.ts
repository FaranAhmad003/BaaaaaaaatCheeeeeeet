// src/messages/dto/create-message.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';
// src/messages/dto/create-message.dto.ts
export class CreateMessageDto {
  recipientEmail: string;
  content: string;
}


