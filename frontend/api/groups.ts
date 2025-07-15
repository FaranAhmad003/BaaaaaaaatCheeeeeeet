// Group API utility
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

export async function createGroup(name: string, members: string[]) {
  const res = await fetch(`${API_URL}/groups/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, members }),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function addMember(groupId: string, userId: string) {
  const res = await fetch(`${API_URL}/groups/add-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ groupId, userId }),
  });
  if (!res.ok) throw new Error('Failed to add member');
  return res.json();
}

export async function listGroups() {
  const res = await fetch(`${API_URL}/groups`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to list groups');
  return res.json();
} 