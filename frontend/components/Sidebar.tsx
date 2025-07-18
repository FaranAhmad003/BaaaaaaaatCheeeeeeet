import React, { useState, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ChatStoreContext } from "../stores/ChatStoreContext";

const Sidebar: React.FC = observer(() => {
  const chatStore = useContext(ChatStoreContext);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [initialMessage, setInitialMessage] = useState("");

  useEffect(() => {
    chatStore.fetchChats();
  }, [chatStore]);

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

  const handleAddChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetEmail: newEmail }),
      });

      const data = await res.json();
      if (res.ok && data.chat) {
        const chat = data.chat;
        const other = chat.participants.find((p: any) => p.email !== currentUserEmail);
        const newChat = {
          id: chat.id,
          name: other.email,
          email: other.email,
          lastMessage: initialMessage,
          time: new Date().toISOString(),
          online: false,
        };

       // Create a fresh array so MobX can track properly
const updatedChats = [newChat, ...chatStore.chats.filter(c => c.id !== chat.id)];
chatStore.setChats(updatedChats);

// ✅ Set last message immediately AFTER setting chats
chatStore.setLastMessage(chat.id, initialMessage, new Date().toISOString());

chatStore.setActiveChat(chat.id);

chatStore.setMessages([
  {
    sender: 'me' as const,
    text: initialMessage,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
]);


        // Send the initial message
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: other.email,
            content: initialMessage,
          }),
        });
      }
    } catch (err) {
      console.error('Chat creation failed:', err);
    }

    setShowNewChat(false);
    setNewEmail("");
    setInitialMessage("");
  };

  return (
    <div style={{ width: 280, background: '#fff', borderRight: '1px solid #e5e7eb', height: '100vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 1rem' }}>
        <span style={{ fontWeight: 700, fontSize: 24, color: '#7c3aed' }}>Chats</span>
        <button onClick={() => setShowNewChat(true)} style={{ fontSize: 24, color: '#7c3aed', background: 'none', border: 'none' }}>+</button>
      </div>

      {/* Animated Modal/Overlay for New Chat/Group Chat */}
      {showNewChat && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s',
          }}
          onClick={() => setShowNewChat(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 8px 32px rgba(124,58,237,0.15)',
              padding: 40,
              minWidth: 340,
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
              animation: 'popIn 0.25s',
              alignItems: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                padding: '18px 0',
                width: 240,
                background: 'linear-gradient(90deg, #7c3aed 0%, #38bdf8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(124,58,237,0.10)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                letterSpacing: 1,
              }}
              className="animated-btn"
            >
              New Message
            </button>
            <button
              style={{
                padding: '18px 0',
                width: 240,
                background: 'linear-gradient(90deg, #f472b6 0%, #facc15 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(244,114,182,0.10)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                letterSpacing: 1,
              }}
              className="animated-btn"
            >
              Start a Group Chat
            </button>
          </div>
          {/* CSS for fade-in, pop-in, and button animation */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes popIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animated-btn {
              will-change: transform, box-shadow;
            }
            .animated-btn:hover {
              transform: scale(1.06);
              box-shadow: 0 6px 24px rgba(124,58,237,0.18);
              z-index: 2;
            }
            .animated-btn:active {
              transform: scale(0.97);
              box-shadow: 0 1px 4px rgba(124,58,237,0.10);
            }
          `}</style>
        </div>
      )}

{[...chatStore.chats].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map(chat => (
  <div
    key={chat.id}
    onClick={() => chatStore.setActiveChat(chat.id)}
    style={{
      padding: '1rem',
      background: chat.id === chatStore.activeChatId ? '#ede9fe' : '#fff',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
  >
    {/* Avatar/DP */}
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#ede9fe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 18,
        color: '#7c3aed',
        flexShrink: 0,
        boxShadow: '0 1px 4px 0 rgba(124,58,237,0.06)',
        border: '1.5px solid #c4b5fd',
      }}
    >
      {chat.name?.[0]?.toUpperCase() || chat.email?.[0]?.toUpperCase() || '?'}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, color: '#22223b' }}>{chat.name}</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>
        {chat.lastMessage};
      </div>
      <div style={{ fontSize: 11, color: '#a1a1aa' }}>
        {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    </div>
  </div>
))}

    </div>
  );
});

export default Sidebar;
