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
  const messages  = chatStore.messages;
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
      padding: '2rem'
    }}>
      {/* Center icon */}
      <div style={{
        background: '#ede9fe',
        borderRadius: '9999px',
        padding: '1.2rem',
        marginBottom: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
          <path d="M7 8h10M7 12h6" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-4.39-1.01L3 21l1.01-3.61A8.96 8.96 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Main text */}
      <div style={{
        fontWeight: 700,
        fontSize: 28,
        color: '#6b7280',
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Start a new chat
      </div>

      {/* Sub text */}
      <div style={{
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        maxWidth: 320,
        marginBottom: 24
      }}>
        Select someone from the sidebar or click the <span style={{ color: '#7c3aed', fontWeight: 600 }}>+</span> button to begin a conversation.
      </div>

      {/* (Optional) Add a new chat button */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 16,
          padding: '10px 20px',
          boxShadow: '0 2px 6px rgba(124,58,237,0.15)',
          cursor: 'pointer'
        }}
        onClick={() => alert('Implement New Chat Flow')}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#fff" />
          <path d="M12 7v10M7 12h10" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Start new chat
      </button>
    </div>
  );
}


  const status = isTyping ? "Typing..." : activeChat.online ? "Online" : "Offline";
  const statusColor = isTyping ? '#f59e42' : activeChat.online ? '#22c55e' : '#6b7280';
  const statusBg = isTyping
    ? 'rgba(245,158,66,0.12)'
    : activeChat.online
      ? 'rgba(34,197,94,0.13)'
      : '#f3f4f6';
  const statusBorder = isTyping
    ? '1.5px solid #f59e42'
    : activeChat.online
      ? '1.5px solid #22c55e'
      : '1.5px solid #e5e7eb';

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
          <div
            style={{
              display: 'inline-block',
              fontSize: 13,
              color: statusColor,
              background: statusBg,
              border: statusBorder,
              borderRadius: 999,
              padding: '3px 14px',
              fontWeight: 600,
              marginTop: 4,
              letterSpacing: 0.2,
              minWidth: 60,
              textAlign: 'center',
              transition: 'background 0.2s, color 0.2s, border 0.2s',
            }}
          >
            {status}
          </div>
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
