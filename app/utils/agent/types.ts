import { ReasoningEngine } from './reasoningUtils';

export interface QuoteExample {
  trigger: string;
  response: string;
  metadata?: Record<string, unknown>;
}

export interface QuoteCategory {
  name: string;
  description: string;
  examples: QuoteExample[];
}

export interface ToolQuotes {
  categories: Record<string, QuoteCategory>;
}

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  context_id: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export type MemoryType = 'pattern' | 'fact' | 'reasoning_step' | 'conclusion' | 'command' | 'context' | 'response';

export interface ReasoningStep {
  stepNumber: number;
  type: 'observation' | 'thought' | 'action' | 'result' | 'decision';
  content: string;
  description: string;
  explanation?: string;
  observation?: string;
  decision?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
  id?: string;
}

export interface ReasoningChain {
  id: string;
  context_id?: string;
  steps: ReasoningStep[];
  conclusion?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryState {
  recent_operations: Array<{
    id: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, unknown>;
  }>;
  active_contexts: string[];
  user_preferences: Record<string, unknown>;
  conversation_history: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  learned_patterns: Array<{
    id: string;
    type: string;
    content: string;
    pattern: string;
    last_observed: string;
    timestamp: string;
    confidence: number;
    metadata: Record<string, unknown>;
  }>;
  saved_contexts: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    data: Record<string, unknown>;
    updated_at: string;
  }>;
}

export interface AgentContext {
  user_id: string;
  session_id: string;
  memory_state: MemoryState;
  current_task?: string;
  metadata: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMessage extends Message {
  reasoning_chain?: ReasoningChain;
  tool_executions?: ToolExecution[];
}

export interface AgentResponse {
  message: AgentMessage;
  memory_updates?: MemoryEntry[];
  context_updates?: Partial<AgentContext>;
}

export interface ToolValidationRule {
  type: 'type' | 'enum' | 'range' | 'pattern' | 'custom';
  expected?: string;
  values?: unknown[];
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  validation?: ToolValidationRule[];
  schema?: ToolParameter[];
}

export interface ToolParameterDefinition {
  type: string;
  description: string;
  required?: boolean;
  enum?: string[];
  schema?: ToolParameter[];
}

export interface ToolMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  parameters: Record<string, ToolParameterDefinition>;
  required: string[];
  examples: ToolExample[];
}

export interface ToolExample {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  expected_result: string;
}

export interface Tool {
  name: string;
  description: string;
  version: string;
  category: string;
  parameters: ToolParameter[];
  metadata: ToolMetadata;
  examples: ToolExample[];
  handler(args: Record<string, unknown>): Promise<unknown>;
  setContext(context: ToolContext): void;
  execute(args: Record<string, unknown>): Promise<unknown>;
}

export interface ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
  validate(toolName: string, args: Record<string, unknown>): Promise<boolean>;
  [key: string]: Tool | any;
}

export interface ToolContext {
  contextId: string;
  chainId?: string;
  sessionId: string;
  permissions: Record<string, boolean>;
  metadata?: Record<string, unknown>;
}

export interface NextAction {
  tool: string;
  args: Record<string, unknown>;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
  chainId?: string;
  completed?: boolean;
  reasoningSteps?: ThoughtStep[];
  nextAction?: NextAction;
  metadata?: Record<string, unknown>;
}

export interface ToolExecution {
  tool: string;
  args: Record<string, unknown>;
  result: ToolResult;
  timestamp: string;
}

export interface ToolVerifier {
  preExecute?: (args: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  postExecute?: (args: Record<string, unknown>, result: unknown) => Promise<{ success: boolean; message: string }>;
  customChecks?: Array<(args: Record<string, unknown>, result?: unknown) => Promise<{ success: boolean; message: string }>>;
}

export interface SystemState {
  status: 'running' | 'stopped' | 'error';
  memory_usage: NodeJS.MemoryUsage;
  uptime: number;
  error?: string;
  timezone: string;
  current_time: string;
  session_id: string;
  user_id: string;
  permissions: string[];
}

export interface ResourceState {
  cpu_usage: number;
  memory_available: number;
  disk_space: number;
  network_status: 'connected' | 'disconnected';
  memory_usage: string;
  storage_usage: string;
  api_calls_remaining: number;
  active_processes: string[];
}

export interface ThoughtStep {
  id: string;
  type: 'analysis' | 'plan' | 'observation' | 'decision';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Command {
  id: string;
  name: string;
  command: string;
  category: string;
  description: string;
  parameters: Record<string, unknown>;
  aliases: string[];
  examples?: string[];
  metadata?: Record<string, unknown>;
  created_at: number;
  updated_at: number;
} 