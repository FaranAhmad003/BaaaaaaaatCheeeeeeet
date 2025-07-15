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
    if (!token) return socket.disconnect();

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const userId = payload.sub;
      const email = payload.email;

      this.onlineUsers.set(userId, { userId, email, socketId: socket.id });

      // Attach userId and email to socket.data for later use
      socket.data.userId = userId;
      socket.data.email = email;

      // Notify only others
      socket.broadcast.emit('userOnline', { userId, email });
      

      // Send updated list to current user
      socket.emit('onlineUsers', Array.from(this.onlineUsers.values()));

    } catch (err) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userEntry = [...this.onlineUsers.entries()].find(([_, user]) => user.socketId === socket.id);

    if (userEntry) {
      const [userId, user] = userEntry;
      this.onlineUsers.delete(userId);

      // Notify others
      this.server.emit('userOffline', { userId, email: user.email });

    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
    socket.emit('onlineUsers', Array.from(this.onlineUsers.values()));
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() socket: Socket, @MessageBody() data: { recipientEmail: string }) {
    // Find the recipient's socket by email
    const recipient = Array.from(this.onlineUsers.values()).find(u => u.email === data.recipientEmail);
    if (recipient) {
      this.server.to(recipient.socketId).emit('typing', { email: this.onlineUsers.get(socket.data.userId)?.email });
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(@ConnectedSocket() socket: Socket, @MessageBody() data: { recipientEmail: string }) {
    const recipient = Array.from(this.onlineUsers.values()).find(u => u.email === data.recipientEmail);
    if (recipient) {
      this.server.to(recipient.socketId).emit('stopTyping', { email: this.onlineUsers.get(socket.data.userId)?.email });
    }
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { recipientEmail: string; content: string }
  ) {
    const senderEntry = [...this.onlineUsers.entries()].find(([_, user]) => user.socketId === socket.id);
    if (!senderEntry) return;

    const [senderId, sender] = senderEntry;

    const recipient = Array.from(this.onlineUsers.values()).find(u => u.email === data.recipientEmail);
    if (recipient) {
      // Send to recipient
      this.server.to(recipient.socketId).emit('message', {
        sender: {
          email: sender.email,
          id: senderId
        },
        content: data.content,
        createdAt: new Date().toISOString(), // Optional timestamp
      });
    }

    // Optionally echo back to sender (e.g., for immediate UI update)
    socket.emit('message', {
      sender: {
        email: sender.email,
        id: senderId
      },
      content: data.content,
      createdAt: new Date().toISOString(),
    });
  }
}
