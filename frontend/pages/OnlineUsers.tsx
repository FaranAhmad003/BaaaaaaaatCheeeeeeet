// pages/OnlineUsers.tsx
import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface OnlineUser {
  userId: string;
  email: string;
}

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io('ws://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // On connect, always request the current online users list
    socket.on('connect', () => {
      socket.emit('getOnlineUsers');
    });

    // On receiving the full online users list, update all chats
    socket.on('onlineUsers', (users: OnlineUser[]) => {
      setOnlineUsers(users.map((u: OnlineUser) => ({ ...u, online: true })));
    });

    // On receiving userOnline, update only that chat
    socket.on('userOnline', ({ email }) => {
      setOnlineUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.email.toLowerCase() === email.toLowerCase() ? { ...user, online: true } : user
        )
      );
    });

    // On receiving userOffline, update only that chat
    socket.on('userOffline', ({ email }) => {
      setOnlineUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.email.toLowerCase() === email.toLowerCase() ? { ...user, online: false } : user
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Online Users:</h2>
      <ul>
        {onlineUsers.map((user) => (
          <li key={user.userId}>{user.email}</li>
        ))}
      </ul>
    </div>
  );
}
