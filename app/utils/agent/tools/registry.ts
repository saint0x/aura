import { Tool, ToolRegistry } from './types';

class ToolRegistryImpl implements ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Tools will be registered by PromptManager
  }

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    // Validate tool metadata
    if (!tool.metadata || !tool.metadata.parameters) {
      throw new Error(`Tool ${tool.name} is missing required metadata or parameters`);
    }

    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(category?: string): Tool[] {
    const tools = Array.from(this.tools.values());
    if (category) {
      return tools.filter(tool => tool.category === category);
    }
    return tools;
  }

  async validate(name: string, params: Record<string, unknown>): Promise<boolean> {
    const tool = this.get(name);
    if (!tool || !tool.metadata) {
      return false;
    }

    // Validate required parameters
    const required = tool.metadata.required || [];
    for (const param of required) {
      if (!(param in params)) {
        return false;
      }
    }

    return true;
  }

  async execute(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    const isValid = await this.validate(name, params);
    if (!isValid) {
      throw new Error(`Invalid parameters for tool ${name}`);
    }

    return tool.handler(params);
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistryImpl(); 