/**
 * Perceptual image hashing using the Average Hash (aHash) algorithm.
 * Downscales the image to 8x8 grayscale, computes the average, and
 * produces a 64-bit hash where each bit is 1 if the pixel is above average.
 */

const HASH_SIZE = 8;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getGrayscalePixels(img: HTMLImageElement, size: number): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels: number[] = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    pixels.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return pixels;
}

export async function computeImageHash(imageUrl: string): Promise<string | null> {
  try {
    const img = await loadImage(imageUrl);
    const pixels = getGrayscalePixels(img, HASH_SIZE);
    if (pixels.length === 0) return null;
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
    let hash = '';
    for (let i = 0; i < pixels.length; i++) {
      hash += pixels[i] > avg ? '1' : '0';
    }
    return hash;
  } catch {
    return null;
  }
}

export function hammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return distance;
}

export function imageSimilarity(hashA: string | null, hashB: string | null): number {
  if (!hashA || !hashB) return 0;
  const distance = hammingDistance(hashA, hashB);
  return 1 - distance / 64;
}
