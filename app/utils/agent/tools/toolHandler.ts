import { Tool, ToolResult } from './types';
import { ChainOfThought } from '../prompts/chain-of-thought';

export class ToolHandler {
  private tools: Map<string, Tool> = new Map();
  private chainOfThought: ChainOfThought;

  constructor(chainOfThought: ChainOfThought) {
    this.chainOfThought = chainOfThought;
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      const result = await tool.execute(args);
      // Record successful execution
      this.chainOfThought.recordToolExecution(name, result, true);
      return {
        success: true,
        result
      };
    } catch (error) {
      // Record failed execution
      this.chainOfThought.recordToolExecution(name, error, false);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  getToolMetadata(name: string): Tool['metadata'] | null {
    return this.tools.get(name)?.metadata || null;
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  hasToolBeenExecuted(name: string): boolean {
    return this.chainOfThought.hasToolBeenExecuted(name);
  }

  getToolExecutionResult(name: string): unknown | null {
    return this.chainOfThought.getToolExecutionResult(name);
  }
} 