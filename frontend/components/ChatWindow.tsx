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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  // Robust scroll to bottom: MutationObserver + fallback on messages.length
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    const observer = new MutationObserver(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (message.trim() && activeChat && currentUserEmail) {
      await chatStore.sendMessage(activeChat.id, message.trim(), activeChat.email);
      const now = new Date().toISOString();
      chatStore.setLastMessage(activeChat.id, message.trim(), now);
      setMessage("");
    }
  };

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

  if (!activeChat) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#f3f4f6',
        borderRadius: '1.5rem',
        minHeight: 400,
      }}>
        <div style={{
          fontSize: 72,
          color: '#a78bfa',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Text message icon (SVG) */}
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="#ede9fe"/>
            <path d="M7 8h10M7 12h6" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-4.39-1.01L3 21l1.01-3.61A8.96 8.96 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontWeight: 700, fontSize: 28, color: '#7c3aed', marginBottom: 10 }}>Start a new chat</div>
        <div style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', maxWidth: 320 }}>
          Select a chat from the sidebar or click the <span style={{ color: '#7c3aed', fontWeight: 600 }}>+</span> button to begin a new conversation.
        </div>
      </div>
    );
  }

  const status = isTyping ? "Typing..." : activeChat.online ? "Online" : "Offline";
  const statusColor = isTyping ? '#f59e42' : activeChat.online ? '#22c55e' : '#a1a1aa';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #ede9fe',
        background: '#ede9fe',
        borderTopLeftRadius: '1.5rem',
        borderTopRightRadius: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
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
          style={{
            background: '#fff',
            color: '#7c3aed',
            border: '1px solid #7c3aed',
            borderRadius: 8,
            padding: '0.4rem 1.1rem',
            fontWeight: 600,
            fontSize: 15,
            marginLeft: 16,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        background: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        scrollBehavior: 'smooth'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'me' ? '#ede9fe' : '#fff',
              color: '#22223b',
              borderRadius: '1rem',
              padding: '0.7rem 1.1rem',
              fontSize: 15,
              maxWidth: 340,
              boxShadow: '0 1px 4px 0 rgba(31,38,135,0.04)',
              marginBottom: 2,
              border: msg.sender === 'me' ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
              wordBreak: 'break-word',
              position: 'relative'
            }}
          >
            <span>{msg.text}</span>
            <div style={{ fontSize: 10, textAlign: 'right', opacity: 0.6 }}>{msg.time}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid #ede9fe',
        background: '#fff',
        borderBottomLeftRadius: '1.5rem',
        borderBottomRightRadius: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        padding: '1rem'
      }}>
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
