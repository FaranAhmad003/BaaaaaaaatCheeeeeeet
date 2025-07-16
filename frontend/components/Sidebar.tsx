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

      {showNewChat && (
        <form onSubmit={handleAddChat} style={{ padding: '1rem' }}>
          <input
            type="email"
            placeholder="Recipient Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10, padding: 10 }}
          />
          <textarea
            placeholder="Initial Message"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            required
            style={{ width: '100%', height: 60, marginBottom: 10, padding: 10 }}
          />
          <button type="submit" style={{ padding: 10, background: '#7c3aed', color: 'white', border: 'none', borderRadius: 5 }}>
            Start Chat
          </button>
        </form>
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
    }}
  >
    <div style={{ fontWeight: 600, color: '#22223b' }}>{chat.name}</div>
    <div style={{ fontSize: 13, color: '#6b7280' }}>
      {chat.lastMessage};
    </div>
    <div style={{ fontSize: 11, color: '#a1a1aa' }}>
      {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
    </div>
  </div>
))}

    </div>
  );
});

export default Sidebar;
