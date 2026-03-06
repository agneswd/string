import { useState, useEffect } from 'react';

export const AVATAR_COLORS = [
  '#3870a0', '#389878', '#9a8428', '#a05a38',
  '#a04030', '#5048a0', '#3880a0', '#708840',
  '#983840', '#5870a0', '#a06038', '#5c6470',
] as const;

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

  const detectMimeType = (): string => {
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'image/png'
    }

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg'
    }

    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    ) {
      return 'image/webp'
    }

    if (
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    ) {
      return 'image/gif'
    }

    return 'image/png'
  }

  const mimeType = detectMimeType()
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
  const base64 = btoa(binary)
  return `data:${mimeType};base64,${base64}`
}
