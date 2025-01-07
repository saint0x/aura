import { VerificationResult } from './verification';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  validation?: ValidationRule[];
  schema?: ToolParameter[];
}

export interface ToolExample {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  expected_result: string;
}

export interface ToolParameterDefinition {
  type: string;
  description: string;
  required?: boolean;
  enum?: string[];
  schema?: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    validation?: ValidationRule[];
  }>;
}

export interface ToolMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  parameters: Record<string, ToolParameterDefinition>;
  required: string[];
  examples?: ToolExample[];
  properties?: Record<string, {
    name: string;
    type: string;
    description: string;
    required: boolean;
    validation?: ValidationRule[];
    schema?: ToolParameter[];
  }>;
}

export interface ToolVerifier {
  preExecute?: (params: Record<string, unknown>) => Promise<VerificationResult>;
  postExecute?: (params: Record<string, unknown>, result: unknown) => Promise<VerificationResult>;
  customChecks?: Array<(params: Record<string, unknown>, result?: unknown) => Promise<VerificationResult>>;
}

export interface Tool {
  name: string;
  description: string;
  category: string;
  version: string;
  metadata: ToolMetadata;
  handler(args: Record<string, unknown>): Promise<unknown>;
  execute(args: Record<string, unknown>): Promise<unknown>;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface ToolExecution {
  tool: string;
  result: unknown;
  success: boolean;
  timestamp: Date;
}

export interface ToolContext {
  chainOfThought: {
    hasToolBeenExecuted(tool: string): boolean;
    getToolExecutionResult(tool: string): unknown | null;
    recordToolExecution(tool: string, result: unknown, success: boolean): void;
  };
}

export type ValidationRule = 
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