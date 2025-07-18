// src/messages/messages.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'gaXl1zFkFrMMPzQF5WqoMyt7GoDqiRD2HleSB8F2NGw=';

interface OnlineUser {
  userId: string;
  email: string;
  socketId: string;
}

@WebSocketGateway({ cors: { origin: 'http://localhost:3000', credentials: true } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers: Map<string, OnlineUser> = new Map();

  handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.warn("❌ No token provided");
      return socket.disconnect();
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const userId = payload.sub;
      const email = payload.email;

      console.log(`✅ User connected: ${email} (${userId}) via ${socket.id}`);

      // Save user
      this.onlineUsers.set(userId, { userId, email, socketId: socket.id });

      // Save to socket data for disconnect cleanup
      socket.data.userId = userId;
      socket.data.email = email;

      // Join their personal room
      socket.join(email);

      // Inform others
      socket.broadcast.emit('userOnline', { email });

      // Send full list to current user
      socket.emit('onlineUsers', Array.from(this.onlineUsers.values()).map(u => ({ email: u.email })));
    } catch (err) {
      console.error("❌ Invalid token", err);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const disconnectedUser = [...this.onlineUsers.entries()].find(([_, user]) => user.socketId === socket.id);

    if (disconnectedUser) {
      const [userId, user] = disconnectedUser;
      this.onlineUsers.delete(userId);

      console.log(`⚠️ User disconnected: ${user.email} (${userId})`);

      // Notify others
      this.server.emit('userOffline', { email: user.email });
    }
  }

  @SubscribeMessage('send_message')
  handleSendMessage(@ConnectedSocket() socket: Socket, @MessageBody() payload: any) {
    const { chatId, content, recipientEmail, sender, createdAt } = payload;

    const message = {
      chatId,
      content,
      recipientEmail,
      sender,
      createdAt: createdAt || new Date().toISOString(),
    };

    // Emit to recipient's room
    this.server.to(recipientEmail).emit('receive_message', message);

    // Emit to sender's own room (for self echo)
    this.server.to(sender).emit('receive_message', message);

    console.log("📤 Message sent from", sender, "to", recipientEmail, "=>", content);
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
    socket.emit('onlineUsers', Array.from(this.onlineUsers.values()).map(u => ({ email: u.email })));
  }
}
