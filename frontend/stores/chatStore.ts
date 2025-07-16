// stores/ChatStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import { getSocket } from "../utils/socket";
import { getMessages, sendMessage as sendMessageApi } from "../api/messages";
import { getChatSummaries } from "../api/chats";
import { fetchAllChatMessages } from "../api/messages";

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

export class ChatStore {
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

getLastMessage(chatId: string): { lastMessage: string, time: string } | null {
  const chat = this.chats.find(chat => chat.id === chatId);
  if (chat) {
    return { lastMessage: chat.lastMessage, time: chat.time };
  }
  return null;
}

setLastMessage(chatId: string, lastMessage: string, time: string) {
  const updatedChats = this.chats.map(chat =>
    chat.id === chatId
      ? { ...chat, lastMessage, time }
      : chat
  );

  this.chats = [...updatedChats].sort((a, b) =>
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
      const data = await getMessages(chatId);
      const userEmail = typeof window !== "undefined"
        ? JSON.parse(atob((localStorage.getItem("accessToken") || "").split(".")[1])).email
        : "";

      runInAction(() => {
        this.messages = (data.messages || []).map((msg: any): Message => {
          let sender: 'me' | 'other';
          if (msg.sender === userEmail) {
            sender = 'me';
          } else {
            sender = 'other';
          }
          return {
            sender,
            text: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        });
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Failed to load messages";
        this.loading = false;
      });
    }
  }



  async fetchChats() {
    this.loading = true;
    this.error = null;
    try {
      //get data via api here ---- displayed in the inspect/network
      const data = await getChatSummaries();
      console.log("ChatStore : ",data);
      runInAction(() => {
        this.chats = Array.isArray(data.chats) ? data.chats : data;
        // Store the last message for each chat in the global variable
        this.chats.forEach(chat => {
          this.setLastMessage(chat.id, chat.lastMessage, chat.time);
        });
        this.loading = false;
      });
      
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Failed to load chats";
        this.loading = false;
      });
    }
  }

  async sendMessage(chatId: string, content: string, recipientEmail: string) {
    this.loading = true;
    this.error = null;
    try {
      // Send message via API
      await sendMessageApi(chatId, content, recipientEmail);
      const now = new Date().toISOString();
      this.setLastMessage(chatId, content, now);
      await this.loadMessages(chatId);
      // Optionally, emit via socket for real-time update
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
      const socket = typeof window !== 'undefined' ? getSocket(token || '') : null;
      socket?.emit('message', {
        chatId,
        recipientEmail,
        content,
      });

      this.fetchChats();
      runInAction(() => {
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || 'Failed to send message';
        this.loading = false;
      });
    }
  }

  async fetchAllChats(token: string, currentUserEmail: string) {
    this.loading = true;
    this.error = null;
    try {
      const data = await fetchAllChatMessages(token);
      const messages = data.messages || [];
      const chatMap: { [chatId: string]: any } = {};
      const sortedByTime = messages.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      sortedByTime.forEach((msg: any) => {
        const chat = msg.chat;
        let other = chat.participants?.find((p: any) => p.email !== currentUserEmail);
        if (!other && msg.sender.email !== currentUserEmail) {
          other = msg.sender;
        }
        if (other && chat.id && !chatMap[chat.id]) {
          chatMap[chat.id] = {
            id: chat.id,
            name: other.email,
            email: other.email,
            lastMessage: this.getLastMessage(chat.id)?.lastMessage || msg.content,
            time: msg.createdAt,
            online: false,
          };
        }
      });
      const allChats = Object.values(chatMap);
      this.setChats(allChats);
      
      if (!this.activeChatId && allChats.length > 0) {
        this.setActiveChat(allChats[0].id);
      }
      this.loading = false;
    } catch (err: any) {
      this.error = err.message || "Failed to load all chats";
      this.loading = false;
    }
  }

  connectSocket(token: string, currentUserEmail: string) {
    const socket = getSocket(token);
    if ((socket as any)._messageListenerSet) return;
    (socket as any)._messageListenerSet = true;

    socket.on("message", (msg: any) => {
      const chatId = msg.chat?.id;
      const senderEmail = msg.sender?.email;
      const isMe = senderEmail === currentUserEmail;

const newMessage: Message = {
  sender: (isMe ? "me" : "other") as "me" | "other",
  text: msg.content,
  time: new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
};


      if (chatId === this.activeChatId) {
        this.messages.push(newMessage);
      }

      
    });
  }
}

export const chatStore = new ChatStore();
