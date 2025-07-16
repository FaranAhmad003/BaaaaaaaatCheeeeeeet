import React, { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket } from '../utils/socket';
import { ChatStoreContext } from '../stores/ChatStoreContext';
import { observer } from "mobx-react-lite";


const ChatWindow: React.FC = () => {
  const chatStore = useContext(ChatStoreContext);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);

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

  const activeChat = chatStore.chats.find(c => c.id === chatStore.activeChatId);
  const messages = chatStore.messages;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const socket = typeof window !== 'undefined' ? getSocket(token || '') : null;

  // Typing indicators
  useEffect(() => {
    if (!socket || !activeChat) return;

    const handleTyping = ({ email }: { email: string }) => {
      if (email === activeChat.email) setIsTyping(true);
    };
    const handleStopTyping = ({ email }: { email: string }) => {
      if (email === activeChat.email) setIsTyping(false);
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket, activeChat]);

  // Scroll to last message
  useEffect(() => {
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

const handleSend = async () => {
  if (message.trim() && activeChat && currentUserEmail) {
    await chatStore.sendMessage(activeChat.id, message.trim(), activeChat.email);
    // After sending the message, update the chat's lastMessage and time
    if (activeChat) {
      const now = new Date().toISOString();
      chatStore.setLastMessage(activeChat.id, message.trim(), now);
    }
    setMessage("");
  }
};
/*setLastMessage(chatId: string, lastMessage: string, time: string) {
  const updatedChats = this.chats.map(chat =>
    chat.id === chatId
      ? { ...chat, lastMessage, time }
      : chat
  );*/ 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (socket && activeChat) {
      socket.emit('typing', { recipientEmail: activeChat.email });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { recipientEmail: activeChat.email });
      }, 1200);
    }
  };

  if (!activeChat) return null;

  const status = isTyping ? "Typing..." : activeChat.online ? "Online" : "Offline";
  const statusColor = isTyping ? '#f59e42' : activeChat.online ? '#22c55e' : '#a1a1aa';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #ede9fe', background: '#ede9fe', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#7c3aed' }}>{activeChat.name}</div>
          <div style={{ fontSize: 13, color: statusColor }}>{status}</div>
        </div>
        <button
          onClick={() => {
            disconnectSocket();
            localStorage.removeItem('accessToken');
            router.push('/login');
          }}
          style={{ background: '#fff', color: '#7c3aed', border: '1px solid #7c3aed', borderRadius: 8, padding: '0.4rem 1.1rem', fontWeight: 600, fontSize: 15, marginLeft: 16, cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f3f4f6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            ref={idx === messages.length - 1 ? lastMsgRef : undefined}
            style={{
              alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'me' ? '#7c3aed' : '#fff',
              color: msg.sender === 'me' ? '#fff' : '#111',
              borderRadius: '1.25rem',
              padding: '0.75rem 1.25rem',
              fontSize: 16,
              maxWidth: 350,
              boxShadow: '0 2px 8px 0 rgba(31,38,135,0.04)',
            }}
          >
            <span style={{ display: 'block', marginBottom: 4 }}>{msg.text}</span>
            <div style={{ fontSize: 10, textAlign: 'right', opacity: 0.7 }}>{msg.time}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #ede9fe', background: '#fff', borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem', display: 'flex', alignItems: 'center', padding: '1rem' }}>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "1.25rem",
            fontSize: 16,
            outline: "none",
            marginRight: 12,
          }}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          onClick={handleSend}
          style={{
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default observer(ChatWindow);
