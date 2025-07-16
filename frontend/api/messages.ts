// Message API utility
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAuthHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export async function getMessages(chatId: string) {
  const res = await fetch(`${API_URL}/messages/${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if(res.status===404) return {message :[]};
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(chatId: string, content: string, recipientEmail?: string) {
  const body: any = { chatId, content };
  if (recipientEmail) body.recipientEmail = recipientEmail;
  const res = await fetch(`${API_URL}/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function fetchAllChatMessages(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch all chat messages');
  return res.json();
}