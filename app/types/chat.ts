export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
  error?: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error?: string;
}

export interface ChatResponse {
  message: Message;
  metadata?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
} 