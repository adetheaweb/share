import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code, 
  File,
  Globe
} from 'lucide-react';
import { SharedItem, SharedItemType } from './types';

// Format bytes to readable size
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Categorize item based on mime type or file extension
export function categorizeFile(mimeType?: string, fileName?: string): string {
  if (!mimeType) {
    if (!fileName) return 'other';
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'other';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md'].includes(ext)) return 'document';
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'other';
    return 'other';
  }

  const mainType = mimeType.split('/')[0];
  if (mainType === 'image') return 'image';
  if (mainType === 'video') return 'video';
  if (mainType === 'audio') return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('msword') || mimeType.includes('officedocument') || mimeType.includes('text') || mimeType.includes('document')) return 'document';
  return 'other';
}

// Get appropriate icon for a file or link
export function getItemIcon(type: SharedItemType, fileType?: string, fileName?: string) {
  if (type === 'link') return Globe;
  
  const category = categorizeFile(fileType, fileName);
  switch (category) {
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    case 'document':
      return FileText;
    default:
      if (fileType?.includes('zip') || fileType?.includes('archive') || fileName?.endsWith('.zip') || fileName?.endsWith('.rar')) {
        return Archive;
      }
      if (fileType?.includes('javascript') || fileType?.includes('typescript') || fileType?.includes('html') || fileType?.includes('css') || fileName?.endsWith('.js') || fileName?.endsWith('.ts') || fileName?.endsWith('.json')) {
        return Code;
      }
      return File;
  }
}

// Custom safety encoder that converts object to Base64 (Unicode-safe)
export function encodePayload(data: any): string {
  try {
    const json = JSON.stringify(data);
    // Safe base64 conversion that supports Indonesia's Unicode accent / characters
    const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return encoded;
  } catch (e) {
    console.error('Failed encoding payload:', e);
    return '';
  }
}

// Decodes a Safe Base64 string to original object
export function decodePayload(base64: string): any {
  try {
    const json = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed decoding payload:', e);
    return null;
  }
}

// Extracts dynamic website favicons via Google/standard favicon solver
export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch {
    return '';
  }
}
