export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
  preferences: Record<string, unknown>;
  settings: Record<string, unknown>;
  voice_settings: Record<string, unknown>;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  tools_used: string[];
  system_prompt: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: string;
  context_id: string | null;
  metadata: Record<string, unknown>;
  tool_calls: any[] | null;
  audio_url: string | null;
  transcription: string | null;
  tokens_used: number | null;
  model_name: string | null;
}

export interface MemoryEntry {
  id: string;
  user_id: string;
  content: string;
  type: string;
  context_id: string | null;
  embedding: Buffer | null;
  created_at: string;
  metadata: Record<string, unknown>;
  relevance_score: number | null;
  last_accessed_at: string | null;
}

export interface Pattern {
  id: string;
  user_id: string;
  type: string;
  pattern: string;
  confidence: number;
  occurrences: number;
  first_observed_at: string;
  last_observed_at: string;
  metadata: Record<string, unknown>;
  embedding: Buffer | null;
}

export interface Context {
  id: string;
  user_id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  parent_context_id: string | null;
  embedding: Buffer | null;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: string;
  schedule: Record<string, unknown> | null;
  context_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  priority: number;
  dependencies: string[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  parameters: Record<string, unknown>;
  metadata: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface ToolExecution {
  id: string;
  tool_id: string;
  session_id: string;
  parameters: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  duration: number | null;
  metadata: Record<string, unknown>;
}

export interface EmbeddingCache {
  id: string;
  content_hash: string;
  embedding: Buffer;
  created_at: string;
  last_used_at: string | null;
  use_count: number;
  model_version: string | null;
}

export interface ResponseCache {
  id: string;
  query_hash: string;
  response: Record<string, unknown>;
  created_at: string;
  expires_at: string;
  use_count: number;
  model_name: string | null;
  tokens_used: number | null;
}

export interface ToolResultsCache {
  id: string;
  tool_name: string;
  params_hash: string;
  result: Record<string, unknown>;
  created_at: string;
  expires_at: string;
  use_count: number;
}

// Database Error Types
export interface DatabaseErrorOptions {
  message: string;
  cause?: Error;
  code?: string;
}

export class DatabaseError extends Error {
  public cause?: Error;
  public code?: string;

  constructor(options: DatabaseErrorOptions) {
    super(options.message);
    this.name = 'DatabaseError';
    this.cause = options.cause;
    this.code = options.code;
  }
}

// Database Client Types
export interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  connection: {
    filename?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  };
  options?: {
    debug?: boolean;
    timeout?: number;
  };
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
} 