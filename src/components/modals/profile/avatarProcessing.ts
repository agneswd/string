// Avatar image processing utilities for ProfileSettingsModal

const MAX_AVATAR_BYTES = 102_400
const MAX_AVATAR_DIMENSION = 256
const MIN_COMPRESS_QUALITY = 0.45
const DEFAULT_COMPRESS_QUALITY = 0.86

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image for processing'))
    image.src = src
  })

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })

const resizeAvatarToCanvas = (image: HTMLImageElement): HTMLCanvasElement => {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Image processing is not available in this browser')
  }

  context.clearRect(0, 0, targetWidth, targetHeight)
  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  return canvas
}

export const compressAvatarFile = async (file: File): Promise<Blob> => {
  const sourceDataUrl = await fileToDataUrl(file)
  const image = await loadImage(sourceDataUrl)
  const canvas = resizeAvatarToCanvas(image)

  let quality = DEFAULT_COMPRESS_QUALITY
  let bestBlob: Blob | null = null

  while (quality >= MIN_COMPRESS_QUALITY) {
    const maybeBlob = await canvasToBlob(canvas, 'image/webp', quality)
    if (!maybeBlob) break

    bestBlob = maybeBlob
    if (maybeBlob.size <= MAX_AVATAR_BYTES) return maybeBlob
    quality = Number((quality - 0.08).toFixed(2))
  }

  if (bestBlob && bestBlob.size <= MAX_AVATAR_BYTES) return bestBlob

  const pngFallback = await canvasToBlob(canvas, 'image/png')
  if (pngFallback && pngFallback.size <= MAX_AVATAR_BYTES) return pngFallback

  throw new Error('Avatar must be ≤ 100 KB after compression')
}

export { MAX_AVATAR_BYTES }
