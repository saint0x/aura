export class ValidationError extends Error {
  details: Record<string, unknown>;
  param?: string;
  expected?: string;
  received?: string;
  rule?: string;

  constructor(options: { 
    message: string; 
    details?: Record<string, unknown>;
    param?: string;
    expected?: string;
    received?: string;
    rule?: string;
  }) {
    super(options.message);
    this.name = 'ValidationError';
    this.details = options.details || {};
    this.param = options.param;
    this.expected = options.expected;
    this.received = options.received;
    this.rule = options.rule;
  }
}

export class FileSystemError extends Error {
  operation: string;
  path: string;
  details: Record<string, unknown>;

  constructor(operation: string, path: string, options: { message: string; details?: Record<string, unknown> }) {
    super(options.message);
    this.name = 'FileSystemError';
    this.operation = operation;
    this.path = path;
    this.details = options.details || {};
  }
}

export class ToolExecutionError extends Error {
  tool: string;
  details: Record<string, unknown>;

  constructor(tool: string, options: { message: string; details?: Record<string, unknown> }) {
    super(options.message);
    this.name = 'ToolExecutionError';
    this.tool = tool;
    this.details = options.details || {};
  }
} 