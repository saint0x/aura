import { ReasoningChain } from '@/app/utils/agent/types';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageMetadata {
  audioUrl?: string;
  transcription?: string;
  reasoning_chain?: ReasoningChain;
  tool_execution_map?: Record<string, {
    executed: boolean;
    result?: unknown;
    error?: string;
  }>;
  next_steps?: string;
  error_context?: string;
}

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
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
  metadata?: MessageMetadata;
}

export interface ChatRequest {
  message: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
} 