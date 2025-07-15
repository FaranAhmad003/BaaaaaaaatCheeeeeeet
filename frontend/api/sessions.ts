// Session API utility
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

export async function getSession() {
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function endSession() {
  const res = await fetch(`${API_URL}/sessions/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to end session');
  return res.json();
} 