import React, { useState, useEffect, useRef } from 'react';
import Sidebar, { Chat } from '../components/Sidebar';
import ChatWindow, { Message } from '../components/ChatWindow';
import { io, Socket } from 'socket.io-client';

export default function ChatsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Extract current user's email from JWT
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserEmail(payload.email);
      } catch {
        setCurrentUserEmail(null);
      }
    }
  }, []);

  // Fetch all messages (both sent and received) after user is known
  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchAllMessages = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const allMessages = data.messages || [];
      setMessages(allMessages);

      const chatMap: { [chatId: string]: Chat } = {};

      allMessages.forEach((msg: any) => {
        const chat = msg.chat;

        // Try finding the other participant from participants
        let other = chat.participants?.find((p: any) => p.email !== currentUserEmail);

        // Fallback: if participants missing or incomplete, use sender
        if (!other && msg.sender.email !== currentUserEmail) {
          other = msg.sender;
        }

        if (other && !chatMap[chat.id]) {
          chatMap[chat.id] = {
            id: chat.id,
            name: other.email,
            email: other.email,
            lastMessage: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            online: false, // will be updated by socket
          };
        }
      });

      const sortedChats = Object.values(chatMap).sort((a, b) => {
        if (a.online === b.online) return 0;
        return a.online ? -1 : 1;
      });
      setChats(sortedChats);
      if (sortedChats.length > 0 && !selectedChatId) {
        setSelectedChatId(sortedChats[0].id);
      }
    };

    fetchAllMessages();
  }, [currentUserEmail]);

  // Socket.io logic for online status
  useEffect(() => {
    if (!currentUserEmail) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Connect to socket server
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws') || '', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // On connect, always request the current online users list
    socket.on('connect', () => {
      socket.emit('getOnlineUsers');
    });

    // On receiving the full online users list, update all chats
    socket.on('onlineUsers', (users: { email: string }[]) => {
      setChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          online: users.some((u: { email: string }) => u.email.toLowerCase() === chat.email.toLowerCase()),
        }))
      );
    });

    // On receiving userOnline, update only that chat
    socket.on('userOnline', ({ email }) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.email.toLowerCase() === email.toLowerCase() ? { ...chat, online: true } : chat
        )
      );
    });

    // On receiving userOffline, update only that chat
    socket.on('userOffline', ({ email }) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.email.toLowerCase() === email.toLowerCase() ? { ...chat, online: false } : chat
        )
      );
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [currentUserEmail]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const selectedMessages: Message[] = messages
    .filter((msg: any) => msg.chat.id === selectedChatId)
    .map((msg: any) => ({
      sender: msg.sender.email === currentUserEmail ? 'me' : 'other',
      text: msg.content,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'stretch' }}>
      <Sidebar
  chats={chats.sort((a, b) => (a.online === b.online ? 0 : a.online ? -1 : 1))}
  selectedChatId={selectedChatId || ''}
  onSelectChat={setSelectedChatId}
/>

      <div style={{ flex: 1, height: '100vh' }}>
        {selectedChat && (
          <ChatWindow
            chatName={selectedChat.name}
            online={selectedChat.online}
            messages={selectedMessages}
            recipientEmail={selectedChat.email}
          />
        )}
      </div>
    </div>
  );
}
