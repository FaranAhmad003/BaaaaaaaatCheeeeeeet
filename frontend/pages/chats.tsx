import React, { useEffect, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { ChatStoreContext } from '../stores/ChatStoreContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { getSocket } from '../utils/socket';

const ChatsPage: React.FC = observer(() => {
  const router = useRouter();
  const chatStore = useContext(ChatStoreContext);

  const currentUserEmail = typeof window !== 'undefined' ? (() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
      } catch (e) {
        console.error("⚠️ Failed to decode token:", e);
        return null;
      }
    }
    return null;
  })() : null;

  // Redirect to login if no token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn("⚠️ No token found, redirecting to /login");
        router.push('/login');
      }
    }
  }, [router]);

  // Load messages and construct chat list
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
        const sortedByTime = messages.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        sortedByTime.forEach((msg: any) => {
          const chat = msg.chat;
          let other = chat.participants?.find((p: any) => p.email !== currentUserEmail);
          if (!other && msg.sender.email !== currentUserEmail) {
            other = msg.sender;
          }

          if (other && chat.id && !chatMap[chat.id]) {
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

        const allChats = Object.values(chatMap);

        chatStore.setChats(allChats);

if (!chatStore.activeChatId && Object.keys(chatMap).length > 0) {
  const firstChat = Object.values(chatMap)[0];
  if (firstChat?.id) {
    chatStore.setActiveChat(firstChat.id);
  } else {
    console.warn("⚠️ First chat is invalid or missing ID:", firstChat);
  }
} else {
  console.warn("⚠️ No chats found or activeChatId already set.");
}

      } catch (err) {
        console.error("❌ Error loading messages:", err);
      }
    };

    fetchMessages();
  }, [currentUserEmail, chatStore]);

  // Setup socket connections
  useEffect(() => {
    if (!currentUserEmail) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = getSocket(token);

    socket.on('connect', () => {
      socket.emit('getOnlineUsers');
    });

    socket.on('onlineUsers', (users: { email: string }[]) => {
      chatStore.chats.forEach(chat => chatStore.setOnlineStatus(chat.email, false));
      users.forEach(u => chatStore.setOnlineStatus(u.email, true));
    });

    socket.on('userOnline', ({ email }) => {
      chatStore.setOnlineStatus(email, true);
    });

    socket.on('userOffline', ({ email }) => {
      chatStore.setOnlineStatus(email, false);
    });

    chatStore.connectSocket(token, currentUserEmail);

    return () => {
      socket.off('connect');
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [currentUserEmail, chatStore]);

  const selectedChat = chatStore.chats.find((c) => c.id === chatStore.activeChatId);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100vh' }}>
        {selectedChat ? <ChatWindow /> : <div style={{ padding: 20 }}>No chat selected</div>}
      </div>
    </div>
  );
});

export default ChatsPage;
