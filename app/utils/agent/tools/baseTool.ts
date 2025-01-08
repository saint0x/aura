import { Tool, ToolContext, ToolParameter, ToolParameterDefinition, ToolMetadata, ToolExample } from '@/app/utils/agent/types';

export abstract class BaseTool implements Tool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;
  abstract readonly category: string;
  abstract readonly parameters: ToolParameter[];
  abstract readonly metadata: ToolMetadata;
  abstract readonly examples: ToolExample[];

  protected context?: ToolContext;

  setContext(context: ToolContext): void {
    this.context = context;
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    if (!this.context) {
      throw new Error('Tool context not set');
    }
    return this.handler(args);
  }

  abstract handler(args: Record<string, unknown>): Promise<unknown>;

  protected validateParameters(params: Record<string, unknown>): boolean {
    // Implementation here
    return true;
  }
} 