import React, { useEffect, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { ChatStoreContext } from '../stores/ChatStoreContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { getSocket } from '../utils/socket';

const ChatsPage: React.FC = observer(() => {
  const chatStore = useContext(ChatStoreContext);

  const currentUserEmail = typeof window !== 'undefined' ? (() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
      } catch {
        return null;
      }
    }
    return null;
  })() : null;

  // Fetch all messages for the active user and populate chat list
  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchMessages = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const messages = data.messages || [];

        const chatMap: { [chatId: string]: any } = {};
        const sortedByTime = messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        sortedByTime.forEach((msg: any) => {
          const chat = msg.chat;
          let other = chat.participants?.find((p: any) => p.email !== currentUserEmail);
          if (!other && msg.sender.email !== currentUserEmail) {
            other = msg.sender;
          }

          if (other && !chatMap[chat.id]) {
            chatMap[chat.id] = {
              id: chat.id,
              name: other.email,
              email: other.email,
              lastMessage: msg.content,
              time: msg.createdAt,
              online: false,
            };
          }
        });

        chatStore.setChats(Object.values(chatMap));
        if (!chatStore.activeChatId && Object.keys(chatMap).length > 0) {
          chatStore.setActiveChat(Object.values(chatMap)[0].id);
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        // chatStore.loading = false; // Optionally unset loading state if needed
      }
    };

    fetchMessages();
  }, [currentUserEmail, chatStore]);

  // Socket connections
  useEffect(() => {
    if (!currentUserEmail) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const socket = getSocket(token);
    socket.on('connect', () => {
      socket.emit('getOnlineUsers');
    });
    socket.on('onlineUsers', (users: { email: string }[]) => {
      // Set all users offline first
      chatStore.chats.forEach(chat => chatStore.setOnlineStatus(chat.email, false));
      // Set online for users in the list
      users.forEach(u => chatStore.setOnlineStatus(u.email, true));
    });
    socket.on('userOnline', ({ email }) => {
      chatStore.setOnlineStatus(email, true);
    });
    socket.on('userOffline', ({ email }) => {
      chatStore.setOnlineStatus(email, false);
    });
    socket.on('message', (msg: any) => {
      const chatId = msg.chat.id;
      const senderEmail = msg.sender.email;
      const isMe = senderEmail === currentUserEmail;
      const newMessage: import('../stores/chatStore').Message = {
        sender: isMe ? 'me' : 'other',
        text: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      // Only update messages if this is the active chat
      if (chatId === chatStore.activeChatId) {
        chatStore.setMessages([
          ...chatStore.messages,
          newMessage,
        ]);
      }
      chatStore.setLastMessage(chatId, msg.content, msg.createdAt);
    });
    return () => {
      socket.off('connect');
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.off('message');
    };
  }, [currentUserEmail, chatStore]);

  // Always keep selectedMessages in sync with MobX
  const selectedChat = chatStore.chats.find((c) => c.id === chatStore.activeChatId);
  const selectedMessages = chatStore.messages;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100vh' }}>
        {selectedChat && <ChatWindow />}
      </div>
    </div>
  );
});

export default ChatsPage;
