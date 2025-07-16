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
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    chatStore.fetchAllChats(token, currentUserEmail);
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
