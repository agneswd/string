import { Buffer } from 'buffer'

export const AVATAR_COLORS = [
  '#3870a0', '#389878', '#9a8428', '#a05a38',
  '#a04030', '#5048a0', '#3880a0', '#708840',
  '#983840', '#5870a0', '#a06038', '#5c6470',
] as const

export function getAvatarColor(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = ((hash << 5) - hash + name.charCodeAt(index)) | 0
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getInitial(name: string) {
  return (name[0] ?? '?').toUpperCase()
}

export function avatarBytesToUri(bytes: Uint8Array | null | undefined) {
  if (!bytes || bytes.length === 0) {
    return undefined
  }

  let mimeType = 'image/png'

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    mimeType = 'image/jpeg'
  }

  if (
    bytes.length >= 12
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
  ) {
    mimeType = 'image/webp'
  }

  const base64 = Buffer.from(bytes).toString('base64')
  return `data:${mimeType};base64,${base64}`
}
