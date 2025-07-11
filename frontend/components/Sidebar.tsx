import React, { useState } from "react";

export interface Chat {
  id: string;
  name: string;
  email: string;
  lastMessage: string;
  time: string;
  online: boolean;
}

interface SidebarProps {
  chats: Chat[];
  selectedChatId: string;
  onSelectChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, selectedChatId, onSelectChat }) => {
  const [showNewChat, setShowNewChat] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const handleAddChat = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, just close the modal. In a real app, you'd add the chat.
    setShowNewChat(false);
    setNewName("");
    setNewMessage("");
    // Optionally, call a prop to add the chat to the list.
  };

  return (
    <div style={{ width: 280, background: '#fff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 8px 0 rgba(31,38,135,0.04)', height: '100vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1rem' }}>
        <span style={{ fontWeight: 700, fontSize: 24, color: '#7c3aed', letterSpacing: 1 }}>Chats</span>
        <button
          onClick={() => setShowNewChat((v) => !v)}
          style={{
            background: '#ede9fe',
            color: '#7c3aed',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            fontSize: 22,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px 0 rgba(124,60,237,0.08)',
            transition: 'background 0.2s',
          }}
          aria-label="New Chat"
        >
          +
        </button>
      </div>
      {showNewChat && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px 0 rgba(31,38,135,0.10)', margin: '0 1rem 1rem 1rem', padding: '1rem', zIndex: 10 }}>
          <form onSubmit={handleAddChat}>
            <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 8 }}>Start New Chat</div>
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 10, fontSize: 15 }}
              required
            />
            <textarea
              placeholder="Message"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 10, fontSize: 15, minHeight: 60 }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowNewChat(false)}
                style={{ background: '#f3f4f6', color: '#7c3aed', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Start
              </button>
            </div>
          </form>
        </div>
      )}
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: chat.id === selectedChatId ? '#ede9fe' : '#fff',
            cursor: 'pointer',
            borderLeft: chat.id === selectedChatId ? '4px solid #7c3aed' : '4px solid transparent',
            transition: 'background 0.2s, border 0.2s',
            marginBottom: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: chat.online ? '#a78bfa' : '#e5e7eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, marginRight: 12 }}>
              {chat.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#22223b' }}>{chat.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.lastMessage}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#a1a1aa' }}>{chat.time}</div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar; 