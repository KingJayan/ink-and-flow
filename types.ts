export interface Document {
  id: string;
  title: string;
  content: string; // HTML content
  lastModified: number;
  preview: string;
  userId?: string;
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
}

export interface AIState {
  isThinking: boolean;
  ghostText: string | null;
  error: string | null;
}

export enum EditorMode {
  WRITING = 'WRITING',
  FOCUS = 'FOCUS',
}

export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string; // 'sans' | 'serif' | 'mono'
  markdownMode?: boolean;
  enableAiRefinement?: boolean;
  darkMode?: boolean;
  typewriterMode?: boolean;
}