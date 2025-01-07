import { Tool } from './agent/tools/types';
import { ToolUse } from './agent/tools/use';
import { ValidationError } from '@/app/common/errors';
import { toolRegistry } from './agent/tools/registry';
import { toolLogger } from './toolLogger';

export function getTool(name: string): Tool | undefined {
  return toolRegistry.get(name);
}

export async function executeTool(name: string, params: Record<string, unknown>): Promise<unknown> {
  const tool = getTool(name);
  if (!tool) {
    throw new ValidationError({
      message: `Tool '${name}' not found`,
      param: 'name'
    });
  }

  const startTime = Date.now();
  const toolUse = new ToolUse(tool, params);

  try {
    const result = await toolUse.execute();
    await toolLogger.logToolUsage(
      tool.name,
      params,
      startTime,
      'success',
      result
    );
    return result;
  } catch (error) {
    await toolLogger.logToolUsage(
      tool.name,
      params,
      startTime,
      'error',
      undefined,
      error as Error
    );
    throw error;
  }
} 