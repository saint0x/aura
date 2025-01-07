import { Tool } from './types';
import { ValidationError } from '@/app/common/errors';

export class ToolUse {
  public readonly tool: Tool;
  public readonly parameters: Record<string, unknown>;

  constructor(tool: Tool, parameters: Record<string, unknown>) {
    this.tool = tool;
    this.parameters = parameters;
    this.validateParameters();
  }

  private validateParameters() {
    const { required = [], parameters = {} } = this.tool.metadata;
    
    // Check required parameters
    for (const param of required) {
      if (!(param in this.parameters)) {
        throw new ValidationError({
          message: `Missing required parameter: ${param}`,
          param
        });
      }
    }

    // Validate parameter types
    for (const [key, value] of Object.entries(this.parameters)) {
      const paramMetadata = parameters[key];
      if (!paramMetadata) {
        throw new ValidationError({
          message: `Unknown parameter: ${key}`,
          param: key
        });
      }

      // Type validation could be added here if needed
    }
  }

  public async execute(): Promise<unknown> {
    return await this.tool.handler(this.parameters);
  }
} 