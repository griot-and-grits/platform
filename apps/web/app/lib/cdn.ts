/**
 * CDN URL helper for serving media assets from Cloudflare R2
 *
 * This utility handles the CDN URL generation for all media assets.
 * Assets are served from cdn.griotandgrits.org
 */

const CDN_URL = import.meta.env.VITE_CDN_URL || 'https://cdn.griotandgrits.org';

/**
 * Generate CDN URL for a media asset
 * @param path - The media path (e.g., 'bio/D_Jones.jpg' or '/media/bio/D_Jones.jpg')
 * @returns Full CDN URL
 */
export function getCdnUrl(path: string): string {
  // Remove leading slash and /media/ prefix if present
  const cleanPath = path.replace(/^\/?(media\/)?/, '');

  return `${CDN_URL}/web/${cleanPath}`;
}

/**
 * Generate CDN URL for images in the bio directory
 * @param filename - Just the filename (e.g., 'D_Jones.jpg')
 */
export function getBioImageUrl(filename: string): string {
  return getCdnUrl(`bio/${filename}`);
}

/**
 * Generate CDN URL for images in the img directory
 * @param filename - Just the filename (e.g., 'era1.png')
 */
export function getImageUrl(filename: string): string {
  return getCdnUrl(`img/${filename}`);
}

/**
 * Generate CDN URL for logo images
 * @param filename - Just the filename
 */
export function getLogoUrl(filename: string): string {
  return getCdnUrl(`logo/${filename}`);
}

/**
 * Generate CDN URL for video files
 * @param filename - Just the filename
 */
export function getVideoUrl(filename: string): string {
  return getCdnUrl(`vid/${filename}`);
}
