import fs from 'fs/promises';
import path from 'path';
import { isPathAccessible } from '@/app/utils/fileUtils';
import { Tool } from './types';

export interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface VerificationContext {
  toolName: string;
  params: Record<string, unknown>;
  operation?: string;
  result?: unknown;
}

export class ToolVerification {
  private static async verifyFileOperation(
    context: VerificationContext,
    verifyFn: () => Promise<boolean>
  ): Promise<VerificationResult> {
    try {
      const success = await verifyFn();
      return {
        success,
        message: success 
          ? `${context.operation} completed successfully`
          : `Failed to verify ${context.operation?.toLowerCase()}`,
        details: {
          tool: context.toolName,
          params: context.params,
          result: context.result
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Verification failed: ${(error as Error).message}`,
        error: (error as Error).message,
        details: {
          tool: context.toolName,
          params: context.params
        }
      };
    }
  }

  public static async verifyRead(context: VerificationContext): Promise<VerificationResult> {
    const { params } = context;
    return this.verifyFileOperation(
      { ...context, operation: 'Read operation' },
      async () => {
        const filePath = params.relative_workspace_path as string;
        return isPathAccessible(filePath);
      }
    );
  }

  public static async verifyWrite(context: VerificationContext): Promise<VerificationResult> {
    const { params } = context;
    return this.verifyFileOperation(
      { ...context, operation: 'Write operation' },
      async () => {
        const filePath = params.target_path as string;
        const content = params.content as string | undefined;
        
        if (!await isPathAccessible(filePath)) {
          return false;
        }

        if (content !== undefined) {
          const writtenContent = await fs.readFile(filePath, 'utf-8');
          return writtenContent === content;
        }

        return true;
      }
    );
  }

  public static async verifyBrowse(context: VerificationContext): Promise<VerificationResult> {
    const { params } = context;
    return this.verifyFileOperation(
      { ...context, operation: 'Browse operation' },
      async () => {
        const dirPath = params.path as string;
        if (!await isPathAccessible(dirPath)) {
          return false;
        }

        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
      }
    );
  }

  public static async verifyToolResult(
    context: VerificationContext
  ): Promise<VerificationResult> {
    const { result } = context;

    // Ensure we have a result
    if (result === undefined || result === null) {
      return {
        success: false,
        message: 'Tool execution failed: No result returned',
        error: 'Missing tool result',
        details: { tool: context.toolName }
      };
    }

    // Verify result structure
    if (typeof result === 'object' && 'error' in result) {
      return {
        success: false,
        message: `Tool execution failed: ${(result as { error: string }).error}`,
        error: (result as { error: string }).error,
        details: { tool: context.toolName, result }
      };
    }

    return {
      success: true,
      message: 'Tool result verified successfully',
      details: {
        tool: context.toolName,
        result,
        source: 'tool_execution'
      }
    };
  }

  public static async verifyToolExecution(
    context: VerificationContext
  ): Promise<VerificationResult> {
    // First verify the tool result
    const resultVerification = await this.verifyToolResult(context);
    if (!resultVerification.success) {
      return resultVerification;
    }

    // Then verify specific tool operations
    switch (context.toolName) {
      case 'read_file':
        return this.verifyRead(context);
      case 'write_file':
        return this.verifyWrite(context);
      case 'browse_filesystem':
        return this.verifyBrowse(context);
      case 'system':
        return this.verifySystemOperation(context);
      default:
        return resultVerification;
    }
  }

  private static async verifySystemOperation(
    context: VerificationContext
  ): Promise<VerificationResult> {
    const { result } = context;
    
    // Ensure system operation returned valid data
    if (!result || typeof result !== 'object') {
      return {
        success: false,
        message: 'Invalid system operation result',
        error: 'Result must be an object with system data',
        details: { tool: context.toolName }
      };
    }

    return {
      success: true,
      message: 'System operation verified successfully',
      details: {
        tool: context.toolName,
        result,
        source: 'system_tool'
      }
    };
  }
}

export class ToolVerificationEnforcer {
  private tools: Map<string, Tool>;
  
  constructor(tools: Tool[]) {
    this.tools = new Map(tools.map(tool => [tool.name, tool]));
  }

  public enforceToolUsage(operation: string): Tool | undefined {
    // Map operations to required tool categories
    const operationToolMap: Record<string, string[]> = {
      'file': ['read_file', 'write_file', 'delete_file', 'browse_filesystem'],
      'system': ['system', 'process'],
      'memory': ['store_memory', 'retrieve_memory', 'search_memory'],
      'hardware': ['system'],
      'screen': ['screen_capture'],
      'reasoning': ['reasoning_chain']
    };

    // Find matching tools for the operation
    const requiredCategories = operationToolMap[operation] || [];
    const matchingTools = Array.from(this.tools.values())
      .filter(tool => requiredCategories.includes(tool.name));

    return matchingTools[0];
  }

  public validateToolUsage(operation: string, usedTool?: string): VerificationResult {
    const requiredTool = this.enforceToolUsage(operation);
    
    if (requiredTool && (!usedTool || usedTool !== requiredTool.name)) {
      return {
        success: false,
        message: `Operation "${operation}" requires using the "${requiredTool.name}" tool`,
        error: `Missing required tool: ${requiredTool.name}`,
        details: {
          operation,
          requiredTool: requiredTool.name,
          usedTool: usedTool || 'none'
        }
      };
    }

    return {
      success: true,
      message: 'Tool usage requirements satisfied',
      details: {
        operation,
        usedTool
      }
    };
  }

  public enforceToolResult(result: unknown): VerificationResult {
    // Ensure we have a result
    if (result === undefined || result === null) {
      return {
        success: false,
        message: 'Must use tool result as source of truth',
        error: 'No tool result available',
        details: { result }
      };
    }

    // Check if result is from a tool execution
    if (
      typeof result === 'object' &&
      result !== null &&
      'source' in result &&
      (result as any).source.includes('tool_')
    ) {
      return {
        success: true,
        message: 'Using tool result as source of truth',
        details: { result }
      };
    }

    return {
      success: false,
      message: 'Must use tool result instead of general knowledge',
      error: 'Not using tool result as source of truth',
      details: { result }
    };
  }

  public validateResponse(response: unknown): VerificationResult {
    // Ensure response uses tool results
    if (
      typeof response === 'object' &&
      response !== null &&
      'tool_results' in response
    ) {
      return {
        success: true,
        message: 'Response properly uses tool results',
        details: { response }
      };
    }

    return {
      success: false,
      message: 'Response must be based on tool results',
      error: 'Response not using tool results',
      details: { response }
    };
  }
}

// Export singleton instance
export const toolVerificationEnforcer = new ToolVerificationEnforcer([]); 