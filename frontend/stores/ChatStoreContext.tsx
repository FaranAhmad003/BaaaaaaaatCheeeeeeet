import React from "react";
import { chatStore } from "./chatStore";

export const ChatStoreContext = React.createContext(chatStore);

export const ChatStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatStoreContext.Provider value={chatStore}>{children}</ChatStoreContext.Provider>
); 