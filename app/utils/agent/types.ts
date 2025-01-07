import { Message as BaseMessage } from '@/app/types/chat';

// Quote Types
export interface QuoteExample {
  trigger: string;
  response: string;
  metadata?: Record<string, unknown>;
}

export interface QuoteCategory {
  name: string;
  description: string;
  examples: QuoteExample[];
  metadata?: Record<string, unknown>;
}

export interface ToolQuotes {
  categories: Record<string, QuoteCategory>;
  metadata?: Record<string, unknown>;
}

// Memory Types
export type MemoryType = 'message' | 'response' | 'pattern' | 'context' | 'reasoning_step' | 'conclusion';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  context_id: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  parent_id?: string; // For linking reasoning steps
  reasoning_chain_id?: string; // For grouping related reasoning steps
}

export interface ReasoningStep {
  type: 'observation' | 'thought' | 'action' | 'result';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ReasoningChain {
  id: string;
  context_id: string;
  steps: ReasoningStep[];
  conclusion?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface Pattern {
  id: string;
  type: string;
  content: string;
  pattern: string;
  last_observed: string;
  timestamp: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface SavedContext {
  id: string;
  name: string;
  description: string;
  type: string;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface Operation {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface MemoryState {
  recent_operations: Operation[];
  active_contexts: string[];
  user_preferences: Record<string, unknown>;
  conversation_history: Message[];
  learned_patterns: Pattern[];
  saved_contexts: SavedContext[];
}

// System State Types
export interface SystemState {
  timezone: string;
  current_time: string;
  session_id: string;
  user_id: string;
  permissions: string[];
}

export interface ResourceState {
  memory_usage: number;
  storage_usage: number;
  api_calls_remaining: number;
  cpu_usage: number;
  active_processes: string[];
}

export interface Context {
  system: SystemState;
  memory: MemoryState;
  resources: ResourceState;
}

// Message Types
export interface Message extends BaseMessage {
  name?: string;
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
}

// Tool Types
export type ToolValidationRule = 
  | TypeValidationRule
  | EnumValidationRule
  | RangeValidationRule
  | PatternValidationRule
  | CustomValidationRule
  | LengthValidationRule;

export interface TypeValidationRule {
  type: 'type';
  expected: string;
}

export interface EnumValidationRule {
  type: 'enum';
  values: string[];
}

export interface RangeValidationRule {
  type: 'range';
  min: number;
  max: number;
}

export interface LengthValidationRule {
  type: 'length';
  min: number;
  max: number;
}

export interface PatternValidationRule {
  type: 'pattern';
  regex: RegExp;
}

export interface CustomValidationRule {
  type: 'custom';
  message?: string;
  validate: (value: unknown) => boolean;
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  validation?: ToolValidationRule[];
  schema?: ToolParameter[];
}

export interface ToolMetadata {
  properties: Record<string, {
    name: string;
    type: string;
    description: string;
    required: boolean;
    validation?: ToolValidationRule[];
    schema?: ToolParameter[];
  }>;
  required: string[];
}

export interface ToolExample {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  expected_result: string;
}

export interface Tool {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: string;
  readonly parameters: ToolParameter[];
  readonly metadata: ToolMetadata;
  readonly examples: ToolExample[];
  handler(params: Record<string, unknown>): Promise<unknown>;
}

export interface ToolRegistry {
  register: (tool: Tool) => void;
  get: (name: string) => Tool | undefined;
  list: (category?: string) => Tool[];
  validate: (name: string, params: Record<string, unknown>) => Promise<boolean>;
  execute: (name: string, params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolContext {
  user_id: string;
  session_id: string;
  permissions: string[];
  metadata: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
} 