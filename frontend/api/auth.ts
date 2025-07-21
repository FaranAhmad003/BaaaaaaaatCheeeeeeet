import { data } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
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

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function signup(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Signup failed');
  return res.json();
}

export async function requestOtp(email: string) {
  const res = await fetch(`${API_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Request OTP failed');
  return res.json();
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw new Error('Verify OTP failed');
  return res.json();
}

// Chat APIs (secured with Bearer token)
// The error is that getAuthHeaders() can return an object with { Authorization?: undefined }, 
// which is not assignable to the fetch API's HeadersInit type (Record<string, string> or similar).
// The Authorization property must always be a string if present, and should not be included at all if undefined.
// To fix this, always return a Record<string, string> with only string values.

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

export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  const token = localStorage.getItem('accessToken');
  if (!token) return true;
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}
