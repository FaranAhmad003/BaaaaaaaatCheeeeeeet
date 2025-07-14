import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket } from '../utils/socket';

export interface Message {
  sender: "me" | "other";
  text: string;
  time: string;
}

interface ChatWindowProps {
  chatName: string;
  online: boolean;
  messages: Message[];
  recipientEmail: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatName, online, messages: initialMessages, recipientEmail }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get singleton socket
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
  const socket = token ? getSocket(token) : null;

  useEffect(() => {
    if (!socket) return;
    // Listen for typing events
    const handleTyping = ({ email }: { email: string }) => {
      if (email === recipientEmail) setIsTyping(true);
    };
    const handleStopTyping = ({ email }: { email: string }) => {
      if (email === recipientEmail) setIsTyping(false);
    };
    const handleUserOffline = ({ email }: { email: string }) => {
      if (email === recipientEmail) setIsTyping(false);
    };
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('userOffline', handleUserOffline);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket, recipientEmail]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (message.trim()) {
      const now = new Date();
      setMessages((prev) => [
        ...prev,
        {
          sender: "me",
          text: message,
          time: now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0"),
        },
      ]);
      const token = localStorage.getItem("accessToken");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail,
            content: message,
          }),
        });
        const data = await res.json();
        // Optionally, update the UI with the response (e.g., message ID, chat info)
      } catch (err) {
        // Optionally, handle error (e.g., show a toast)
      }
      setMessage("");
      // Emit stopTyping when message is sent
      if (socket) {
        socket.emit('stopTyping', { recipientEmail });
      }
    }
  };

  // Typing event logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { recipientEmail });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { recipientEmail });
      }, 1200);
    }
  };

  // Status logic: Typing... > Online > Offline
  let status = 'Offline';
  let statusColor = '#a1a1aa';
  if (online) {
    status = 'Online';
    statusColor = '#22c55e';
  }
  if (online && isTyping) {
    status = 'Typing...';
    statusColor = '#f59e42';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #ede9fe', background: '#ede9fe', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#7c3aed' }}>{chatName}</div>
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
            cursor: 'pointer',
            boxShadow: '0 2px 8px 0 rgba(124,60,237,0.08)',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Logout
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f3f4f6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          return (
            <div
              key={idx}
              ref={isLast ? lastMsgRef : undefined}
              className={isLast ? 'chat-animate' : ''}
              style={{
                alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'me' ? '#7c3aed' : '#fff',
                color: msg.sender === 'me' ? '#fff' : '#111',
                borderRadius: '1.25rem',
                borderBottomRightRadius: msg.sender === 'me' ? '0.25rem' : '1.25rem',
                borderBottomLeftRadius: msg.sender === 'me' ? '1.25rem' : '0.25rem',
                boxShadow: '0 2px 8px 0 rgba(31,38,135,0.04)',
                padding: '0.75rem 1.25rem',
                fontSize: 16,
                maxWidth: 350,
                marginBottom: 2,
                opacity: isLast ? 0 : 1,
                transform: isLast ? 'translateY(20px)' : 'none',
                animation: isLast ? 'fadeInUp 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards' : 'none',
              }}
            >
              <span style={{ wordBreak: 'break-word', display: 'block', marginBottom: 4 }}>{msg.text}</span>
              <div style={{ fontSize: 10, textAlign: 'right', opacity: 0.7 }}>{msg.time}</div>
            </div>
          );
        })}
      </div>
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
          aria-label="Send"
        >
          &#x27A4;
        </button>
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .chat-animate {
          opacity: 0;
          animation: fadeInUp 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default ChatWindow; 