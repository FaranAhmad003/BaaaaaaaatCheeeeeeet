// stores/ChatStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import { getSocket } from "../utils/socket";
import {
  getMessages,
  sendMessage as sendMessageApi,
  fetchAllChatMessages,
} from "../api/messages";
import { getChatSummaries } from "../api/chats";
import { Socket } from "socket.io-client";

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
  socket: Socket | null = null;
  private messageListenerAttached = false;


  constructor() {
    makeAutoObservable(this);
  }

initSocket(token: string) {
  if (typeof window === "undefined") return;

  if (this.socket && this.socket.connected) {
    console.warn("⚠️ Socket already connected, skipping re-init.");
    return;
  }

  console.log("initSocket Called");
  this.socket = getSocket(token);
  this.setupSocketListeners();
}


  setupSocketListeners() {
    if (!this.socket) return;

    const currentUserEmail = this.getCurrentUserEmail();

    this.socket.offAny(); // Clears all existing listeners to avoid duplicates

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.socket?.emit("getOnlineUsers");
    });

    this.socket.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
    });

this.socket.on("receive_message", (message: any) => {
  console.log("📩 Received message:", message);

  const currentUserEmail = this.getCurrentUserEmail();

  const newMessage: Message = {
    sender: message.sender === currentUserEmail ? "me" : "other",
    text: message.content,
    time: new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const isDuplicate = this.messages.some(
    msg => msg.text === newMessage.text && msg.time === newMessage.time
  );

  if (!isDuplicate) {
    runInAction(() => {
      if (message.chatId === this.activeChatId) {
        this.messages.push(newMessage);
      }
      this.setLastMessage(
        message.chatId,
        message.content,
        message.createdAt || new Date().toISOString()
      );
    });
  } else {
    console.warn("⚠️ Duplicate message ignored");
  }
});


    this.socket.on("onlineUsers", (users: { email: string }[]) => {
      this.chats.forEach((chat) => this.setOnlineStatus(chat.email, false));
      users.forEach((user) => this.setOnlineStatus(user.email, true));
    });

    this.socket.on("userOnline", ({ email }) => {
      this.setOnlineStatus(email, true);
    });

    this.socket.on("userOffline", ({ email }) => {
      this.setOnlineStatus(email, false);
    });
  }

  getCurrentUserEmail(): string {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(
          atob((localStorage.getItem("accessToken") || "").split(".")[1])
        ).email;
      } catch {
        return "";
      }
    }
    return "";
  }

  setActiveChat(id: string) {
    this.activeChatId = id;
    this.loadMessages(id);
  }

  setChats(chats: Chat[]) {
    this.chats = chats;
  }

  getLastMessage(chatId: string): { lastMessage: string; time: string } | null {
    const chat = this.chats.find((chat) => chat.id === chatId);
    return chat ? { lastMessage: chat.lastMessage, time: chat.time } : null;
  }

  setLastMessage(chatId: string, lastMessage: string, time: string) {
    const updatedChats = this.chats.map((chat) =>
      chat.id === chatId ? { ...chat, lastMessage, time } : chat
    );

    this.chats = [...updatedChats].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }

  setOnlineStatus(email: string, online: boolean) {
    this.chats = this.chats.map((chat) =>
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
      const userEmail = this.getCurrentUserEmail();

      runInAction(() => {
        this.messages = (data.messages || []).map((msg: any): Message => ({
          sender: msg.sender === userEmail ? "me" : "other",
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
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

  async fetchChats() {
    this.loading = true;
    this.error = null;
    try {
      const data = await getChatSummaries();
      runInAction(() => {
        this.chats = Array.isArray(data.chats) ? data.chats : data;
        this.chats.forEach((chat) => {
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
    const message = {
      chatId,
      content,
      recipientEmail,
      sender: this.getCurrentUserEmail(),
      createdAt: new Date().toISOString(),
    };

    try {
      await sendMessageApi(chatId, content, recipientEmail);
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Failed to send message to database";
      });
    }

    if (this.socket) {
      this.socket.emit("send_message", message);
      console.log("Messgge sent from ChatStore Socket this.socket.emit: ", message);
    }

    runInAction(() => {
      this.messages.push({
        sender: "me",
        text: content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      this.setLastMessage(chatId, content, message.createdAt);
    });
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
        let other = chat.participants?.find(
          (p: any) => p.email !== currentUserEmail
        );
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
}

export const chatStore = new ChatStore();
