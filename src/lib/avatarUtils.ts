import { useState, useEffect } from 'react';

export const AVATAR_COLORS = [
  '#5865f2', // blurple
  '#57f287', // green
  '#fee75c', // yellow
  '#eb459e', // fuchsia
  '#ed4245', // red
  '#3ba55d', // dark green
  '#faa81a', // orange
  '#9b59b6', // purple
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitial(name: string): string {
  return (name[0] ?? '?').toUpperCase();
}

/** Get the user's chosen profile color from localStorage, or null if not set. */
export function getProfileColor(): string | null {
  try {
    return localStorage.getItem('profileColor') || null;
  } catch {
    return null;
  }
}

/** Set the user's profile color and notify listeners. */
export function setProfileColor(color: string): void {
  try {
    localStorage.setItem('profileColor', color);
  } catch { /* noop */ }
  window.dispatchEvent(new CustomEvent('profileColorChanged'));
}

/**
 * React hook that returns the current profile color reactively.
 * Re-renders when the profile color changes anywhere in the app.
 */
export function useProfileColor(): string | null {
  const [color, setColor] = useState<string | null>(() => getProfileColor());
  useEffect(() => {
    const handler = () => setColor(getProfileColor());
    window.addEventListener('profileColorChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('profileColorChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return color;
}

/**
 * Convert a Uint8Array (avatar_bytes) to a data URL for rendering.
 * Returns undefined if input is null/empty.
 */
export function avatarBytesToUrl(bytes: Uint8Array | null | undefined): string | undefined {
  if (!bytes || bytes.length === 0) return undefined
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
  const base64 = btoa(binary)
  return `data:image/png;base64,${base64}`
}
