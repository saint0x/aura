import { Tool, ToolRegistry } from '../types';

export class ToolRegistryImpl implements ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  [key: string]: Tool | any; // Add index signature to match ToolRegistry

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  async validate(toolName: string, args: Record<string, unknown>): Promise<boolean> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }

    // Check required parameters
    const requiredParams = tool.metadata.required;
    for (const param of requiredParams) {
      if (!(param in args)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistryImpl(); 