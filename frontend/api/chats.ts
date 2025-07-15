
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

export async function getUserChats() {
  const res = await fetch(`${API_URL}/chats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export async function startChat(targetEmail: string) {
  const res = await fetch(`${API_URL}/chats/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ targetEmail }),
  });
  if (!res.ok) throw new Error('Failed to start chat');
  return res.json();
}

export async function getChatSummaries() {
  const res = await fetch(`${API_URL}/messages/chat-summaries`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch chat summaries');
  return res.json();
}
