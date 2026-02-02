import axios, { AxiosError } from 'axios';
import { API_ROUTES } from '@quantum-finance/config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('qfe_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: { message?: string; code?: string } }>) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('qfe_token');
      localStorage.removeItem('qfe_user');
    }
    return Promise.reject(err);
  }
);

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('qfe_token', token);
  }
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('qfe_token');
    localStorage.removeItem('qfe_user');
  }
}

export async function login(email: string, password: string, rememberMe?: boolean) {
  const { data } = await api.post(API_ROUTES.auth.login, {
    email,
    password,
    rememberMe,
  });
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  fullName: string;
  address?: string;
  companyName?: string;
  phone?: string;
  idNumber?: string;
  emergencyContact?: string;
}) {
  const { data } = await api.post(API_ROUTES.auth.register, payload);
  return data;
}

export async function logout() {
  try {
    await api.post(API_ROUTES.auth.logout);
  } finally {
    clearAuth();
  }
}

export async function getMe() {
  const { data } = await api.get(API_ROUTES.auth.me);
  return data;
}
