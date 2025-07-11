import React, { useState, useEffect } from 'react';
import Sidebar, { Chat } from '../components/Sidebar';
import ChatWindow, { Message } from '../components/ChatWindow';

export default function ChatsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

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
            online: true,
          };
        }
      });

      setChats(Object.values(chatMap));
      if (Object.values(chatMap).length > 0 && !selectedChatId) {
        setSelectedChatId(Object.values(chatMap)[0].id);
      }
    };

    fetchAllMessages();
  }, [currentUserEmail]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // Filter messages belonging to selected chat
  const selectedMessages: Message[] = messages
    .filter((msg: any) => msg.chat.id === selectedChatId)
    .map((msg: any) => ({
      sender: msg.sender.email === currentUserEmail ? 'me' : 'other',
      text: msg.content,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'stretch' }}>
      <Sidebar chats={chats} selectedChatId={selectedChatId || ''} onSelectChat={setSelectedChatId} />
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
