/**
 * Utility to normalize photo URLs from backend
 * Handles both absolute URLs (http://localhost:4000/uploads/...) 
 * and relative URLs (/uploads/...)
 */

import { BACKEND_ORIGIN } from '../api/axiosClient';

/**
 * Converts a photo URL from database to a usable URL
 * @param url - The URL stored in database (can be absolute or relative)
 * @returns A properly formatted URL that works in current environment
 */
export function getPhotoUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Return Base64 data URLs or Blob URLs directly as-is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // If it's already a full URL with http(s), check if we need to transform it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If URL contains /uploads/, extract path and use current backend origin
    if (url.includes('/uploads/')) {
      const uploadsPath = url.substring(url.indexOf('/uploads'));
      return `${BACKEND_ORIGIN}${uploadsPath}`;
    }
    // Return as-is for external URLs
    return url;
  }
  
  // If it's a relative URL starting with /uploads, prepend backend origin
  if (url.startsWith('/uploads')) {
    return `${BACKEND_ORIGIN}${url}`;
  }
  
  // If it's just a filename, assume it's in uploads
  if (!url.includes('/')) {
    return `${BACKEND_ORIGIN}/uploads/${url}`;
  }
  
  // Return as-is for other URLs
  return url;
}
