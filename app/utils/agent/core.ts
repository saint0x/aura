import { Tool } from './tools/types';
import { getTool } from '../toolUtils';
import { toolRegistry } from './tools/registry';

export class AgentCore {
  private tools: Tool[];

  constructor() {
    this.tools = toolRegistry.list();
  }

  public async executeTool(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.handler(params);
  }
} 