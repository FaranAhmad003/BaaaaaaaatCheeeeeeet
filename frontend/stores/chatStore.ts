import { makeAutoObservable, runInAction } from "mobx";

export interface Chat {
  id: string;
  name: string;
  email: string;
  lastMessage: string;
  time: string;
  online: boolean;
}

export interface Message {
  sender: "me" | "other";
  text: string;
  time: string;
}

class ChatStore {
  chats: Chat[] = [];
  activeChatId: string | null = null;
  messages: Message[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setActiveChat(id: string) {
    this.activeChatId = id;
    this.loadMessages(id);
  }

  setChats(chats: Chat[]) {
    this.chats = chats;
  }

  setLastMessage(chatId: string, lastMessage: string, time: string) {
    const updated = this.chats.map(chat =>
      chat.id === chatId ? { ...chat, lastMessage, time } : chat
    );
    this.chats = updated.sort((a, b) =>
      new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }

  setOnlineStatus(email: string, online: boolean) {
    this.chats = this.chats.map(chat =>
      chat.email.toLowerCase() === email.toLowerCase()
        ? { ...chat, online }
        : chat
    );
  }

  setMessages(messages: Message[]) {
    this.messages = messages;
  }

  addMessage(message: Message) {
    this.messages.push(message);
  }

  async loadMessages(chatId: string) {
    this.loading = true;
    this.error = null;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const userEmail = JSON.parse(atob((token || '').split('.')[1])).email;

      const filtered = (data.messages || []).filter((msg: any) => msg.chat.id === chatId);

      runInAction(() => {
        this.messages = filtered.map((msg: any) => ({
          sender: msg.sender.email === userEmail ? 'me' : 'other',
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Failed to load messages";
        this.loading = false;
      });
    }
  }
}

export const chatStore = new ChatStore();
