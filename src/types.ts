export type SharedItemType = 'file' | 'link';

export interface SharedItem {
  id: string;
  type: SharedItemType;
  title: string;
  url: string; // Direct link OR base64 data url for small files
  description?: string;
  fileSize?: number; // In bytes
  fileType?: string; // MIME type
  createdAt: string; // ISO String
  clicks: number;
  tags: string[];
  isPinned?: boolean;
}

export interface SharePayload {
  title: string;
  type: SharedItemType;
  url: string;
  description?: string;
  fileSize?: number;
  fileType?: string;
  tags?: string[];
}

export type FilterCategory = 'all' | 'file' | 'link' | 'image' | 'document' | 'video' | 'audio' | 'other';
