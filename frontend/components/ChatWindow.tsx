import React, { useState, useRef, useEffect } from "react";

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
  const lastMsgRef = useRef<HTMLDivElement | null>(null);

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
          time: now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0'),
        },
      ]);
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #ede9fe', background: '#ede9fe', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#7c3aed' }}>{chatName}</div>
        <div style={{ fontSize: 13, color: online ? '#22c55e' : '#a1a1aa' }}>{online ? 'Online' : 'Offline'}</div>
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
          onChange={(e) => setMessage(e.target.value)}
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