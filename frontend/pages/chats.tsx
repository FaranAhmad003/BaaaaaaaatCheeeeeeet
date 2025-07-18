import React, { useEffect, useContext, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { ChatStoreContext } from '../stores/ChatStoreContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { getSocket } from '../utils/socket';

const ChatsPage: React.FC = observer(() => {
  const router = useRouter();
  const chatStore = useContext(ChatStoreContext);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // 🔐 Validate and extract user email + socket init
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.email) {
          setCurrentUserEmail(payload.email);
          chatStore.initSocket(token);
        }
      } catch (e) {
        console.error("Failed to decode token:", e);
        router.push('/login');
      }
    }
  }, [router, chatStore]);
  useEffect(() => {
  const token = localStorage.getItem('accessToken');
  if (!token || !currentUserEmail) return;

  const socket = getSocket(token);

  // 🧠 Prevent adding duplicate listeners
  if ((socket as any)._presenceListenersSet) return;
  (socket as any)._presenceListenersSet = true;

  const updateOnlineStatus = () => {
    socket.emit('getOnlineUsers');
  };

  const handleOnlineUsers = (users: { email: string }[]) => {
    chatStore.chats.forEach(chat => chatStore.setOnlineStatus(chat.email, false));
    users.forEach(user => chatStore.setOnlineStatus(user.email, true));
  };

  const handleUserOnline = ({ email }: { email: string }) => {
    chatStore.setOnlineStatus(email, true);
  };

  const handleUserOffline = ({ email }: { email: string }) => {
    chatStore.setOnlineStatus(email, false);
  };

  socket.on('connect', updateOnlineStatus);
  socket.on('onlineUsers', handleOnlineUsers);
  socket.on('userOnline', handleUserOnline);
  socket.on('userOffline', handleUserOffline);

  return () => {
    socket.off('connect', updateOnlineStatus);
    socket.off('onlineUsers', handleOnlineUsers);
    socket.off('userOnline', handleUserOnline);
    socket.off('userOffline', handleUserOffline);

    // reset the flag on cleanup (optional)
    (socket as any)._presenceListenersSet = false;
  };
}, [currentUserEmail, chatStore]);


  // 📩 Load chats
  useEffect(() => {
    if (!currentUserEmail) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    chatStore.fetchAllChats(token, currentUserEmail);
  }, [currentUserEmail, chatStore]);

  const selectedChat = chatStore.chats.find(c => c.id === chatStore.activeChatId);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100vh' }}>
        {selectedChat ? (
          <ChatWindow />
        ) : (
          <div style={{ padding: 20 }}>No chat selected</div>
        )}
      </div>
    </div>
  );
});

export default ChatsPage;
