import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { userStore } from '../stores/userStore';

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = observer(({ open, onClose }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (open) {
      userStore.fetchOtherUserEmails();
      setSearch('');
      setSelected([]);
      setGroupName('');
    }
  }, [open]);

  if (!open) return null;

  const filteredUsers = userStore.users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (email: string) => {
    setSelected(sel =>
      sel.includes(email) ? sel.filter(e => e !== email) : [...sel, email]
    );
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
        <div style={{ fontWeight: 700, fontSize: 22, color: '#7c3aed', marginBottom: 18 }}>Create New Group</div>
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
                onClick={() => toggleSelect(u.email)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer',
                  background: selected.includes(u.email) ? '#ede9fe' : 'transparent',
                  borderRadius: 7, transition: 'background 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(u.email)}
                  readOnly
                  style={{ accentColor: '#7c3aed', width: 18, height: 18 }}
                />
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>{u.email}</span>
              </div>
            ))
          )}
        </div>
        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 15, background: '#f3f4f6', outline: 'none', marginBottom: 18, color: '#22223b' }}
        />
        <button
          style={{
            width: '100%', padding: '12px 0', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,58,237,0.10)', letterSpacing: 0.5,
            transition: 'background 0.18s',
            opacity: groupName && selected.length > 0 ? 1 : 0.6
          }}
          disabled={!groupName || selected.length === 0}
          onClick={() => alert('Implement group creation logic!')}
        >
          Create Group
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

export default NewGroupModal; 