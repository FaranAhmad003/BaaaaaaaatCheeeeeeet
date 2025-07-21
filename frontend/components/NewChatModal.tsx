import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { userStore } from '../stores/userStore';
import { chatStore } from '../stores/chatStore';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  existingChatEmails: string[];
}

const NewChatModal: React.FC<NewChatModalProps> = observer(({ open, onClose, existingChatEmails }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      userStore.fetchOtherUserEmails();
      setSearch('');
      setSelected(null);
      setLoading(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const filteredUsers = userStore.users
    .filter(u => !existingChatEmails.includes(u.email))
    .filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  const handleStartChat = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const newChat = await chatStore.startNewChatWithUser(selected, 'Hi!');
      if (newChat) {
        onClose();
      } else {
        setError('Failed to start chat');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.18s',
    }} onClick={onClose}>
      <div
        style={{
          background: '#fff', borderRadius: 18, minWidth: 370, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(124,58,237,0.13)',
          padding: '2.2rem 2.2rem 1.5rem 2.2rem', position: 'relative',
          animation: 'popIn 0.22s',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}>&times;</button>
        <div style={{ fontWeight: 700, fontSize: 22, color: '#7c3aed', marginBottom: 18 }}>Start New Chat</div>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 15, background: '#f3f4f6', outline: 'none', marginBottom: 14, color: '#22223b' }}
        />
        <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 18 }}>
          {userStore.loading ? (
            <div style={{ color: '#7c3aed', textAlign: 'center', padding: 16 }}>Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ color: '#a1a1aa', textAlign: 'center', padding: 16 }}>No users found</div>
          ) : (
            filteredUsers.map(u => (
              <div
                key={u.email}
                onClick={() => setSelected(u.email)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer',
                  background: selected === u.email ? '#ede9fe' : 'transparent',
                  borderRadius: 7, transition: 'background 0.15s',
                }}
              >
                <input
                  type="radio"
                  checked={selected === u.email}
                  readOnly
                  style={{ accentColor: '#7c3aed', width: 18, height: 18 }}
                />
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>{u.email}</span>
              </div>
            ))
          )}
        </div>
        {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: 10 }}>{error}</div>}
        <button
          style={{
            width: '100%', padding: '12px 0', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,58,237,0.10)', letterSpacing: 0.5,
            transition: 'background 0.18s',
            opacity: selected && !loading ? 1 : 0.6
          }}
          disabled={!selected || loading}
          onClick={handleStartChat}
        >
          {loading ? 'Starting...' : 'Start Chat'}
        </button>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
});

export default NewChatModal; 