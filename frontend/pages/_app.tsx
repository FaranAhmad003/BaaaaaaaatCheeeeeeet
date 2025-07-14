import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ChatStoreProvider } from "../stores/ChatStoreContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChatStoreProvider>
      <Component {...pageProps} />
    </ChatStoreProvider>
  );
}
