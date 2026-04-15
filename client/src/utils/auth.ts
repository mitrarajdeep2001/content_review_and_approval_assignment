import Cookies from 'js-cookie';
import type { AuthUser } from '../types';
import { COOKIE_KEY } from './constants';

export function saveSession(user: AuthUser): void {
  Cookies.set(COOKIE_KEY, JSON.stringify(user), { expires: 1 }); // 1 day
}

export function getSession(): AuthUser | null {
  const raw = Cookies.get(COOKIE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  Cookies.remove(COOKIE_KEY);
}
