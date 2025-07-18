import React, { useState, useContext, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { ChatStoreContext } from "../stores/ChatStoreContext";
// Removed lucide-react icons

const Sidebar: React.FC = observer(() => {
  const chatStore = useContext(ChatStoreContext);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatStore.fetchChats();
  }, [chatStore]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const currentUserEmail = typeof window !== "undefined"
    ? (() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.email;
          } catch {
            return null;
          }
        }
        return null;
      })()
    : null;

  const handleAddChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

        const updatedChats = [newChat, ...chatStore.chats.filter(c => c.id !== chat.id)];
        chatStore.setChats(updatedChats);
        chatStore.setLastMessage(chat.id, initialMessage, new Date().toISOString());
        chatStore.setActiveChat(chat.id);
        chatStore.setMessages([
          {
            sender: "me",
            text: initialMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: other.email,
            content: initialMessage,
          }),
        });
      }
    } catch (err) {
      console.error("Chat creation failed:", err);
    }

    setShowNewChat(false);
    setNewEmail("");
    setInitialMessage("");
  };

  const filteredChats = [...chatStore.chats].filter(chat =>
    chat.name?.toLowerCase().includes(search.toLowerCase()) ||
    chat.email?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div style={{ width: 280, background: "#fff", borderRight: "1px solid #e5e7eb", height: "100vh", overflowY: "auto" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 1rem', position: 'relative' }}>
        <span style={{ fontWeight: 700, fontSize: 24, color: '#7c3aed' }}>Chats</span>
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{ fontSize: 28, color: '#7c3aed', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, width: 36, height: 36, borderRadius: 8, lineHeight: 1, position: 'relative' }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>⋮</span>
        </button>
        {/* Dropdown menu */}
        {showMenu && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: 60,
              right: 16,
              minWidth: 180,
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(124,58,237,0.13)',
              padding: '10px 0',
              zIndex: 100,
              animation: 'dropdownFadeIn 0.18s cubic-bezier(.4,1.3,.6,1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {[
              { label: 'New Group', icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="7" cy="10" r="3" stroke="#7c3aed" strokeWidth="1.5"/><circle cx="17" cy="10" r="3" stroke="#7c3aed" strokeWidth="1.5"/><path d="M7 13c-2.5 0-4.5 1.5-4.5 3v1.5A1.5 1.5 0 0 0 4 19h6a1.5 1.5 0 0 0 1.5-1.5V16c0-1.5-2-3-4.5-3Zm10 0c-2.5 0-4.5 1.5-4.5 3v1.5A1.5 1.5 0 0 0 14 19h6a1.5 1.5 0 0 0 1.5-1.5V16c0-1.5-2-3-4.5-3Z" stroke="#7c3aed" strokeWidth="1.5"/></svg>
              ) },
              { label: 'Linked Devices', icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" stroke="#7c3aed" strokeWidth="1.5"/><path d="M8 17v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1" stroke="#7c3aed" strokeWidth="1.5"/></svg>
              ) },
              { label: 'Read all', icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) },
              { label: 'Settings', icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="#7c3aed" strokeWidth="1.5"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15.4 9a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15z" stroke="#7c3aed" strokeWidth="1.5"/></svg>
              ) },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '13px 24px',
                  fontSize: 16,
                  color: '#22223b',
                  fontWeight: 500,
                  borderRadius: 9,
                  cursor: 'pointer',
                  transition: 'background 0.16s',
                  outline: 'none',
                }}
                onClick={() => setShowMenu(false)}
                onMouseDown={e => e.preventDefault()}
                onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
        <style>{`
          @keyframes dropdownFadeIn {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          button:focus-visible {
            outline: 2px solid #7c3aed;
          }
          .sidebar-dropdown-btn:hover {
            background: #f3f4f6;
          }
        `}</style>
      </div>
      <div style={{ position: 'relative', padding: '0 1rem 1rem 1rem' }}>
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />
      </div>
      

      {filteredChats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => chatStore.setActiveChat(chat.id)}
          style={{
            padding: "1rem",
            background: chat.id === chatStore.activeChatId ? "#ede9fe" : "#fff",
            cursor: "pointer",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "background 0.2s ease-in-out",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              color: "#7c3aed",
              flexShrink: 0,
              boxShadow: "0 1px 4px 0 rgba(124,58,237,0.06)",
              border: "1.5px solid #c4b5fd",
            }}
          >
            {chat.name?.[0]?.toUpperCase() || chat.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#22223b" }}>{chat.name}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{chat.lastMessage}</div>
            <div style={{ fontSize: 11, color: "#a1a1aa" }}>
              {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default Sidebar;
