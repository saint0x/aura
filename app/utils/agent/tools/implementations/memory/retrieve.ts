import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition } from '../../types';
import { memoryManager } from '@/app/utils/memoryUtils';

export class RetrieveMemoryTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      key: {
        type: 'string',
        description: 'The key to retrieve the memory by.',
        required: true
      },
      type: {
        type: 'string',
        description: 'The type of memory to retrieve.',
        required: true,
        enum: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
        required: true
      }
    };

    const required = ['key', 'type', 'explanation'];

    const examples = [
      {
        name: 'Retrieve fact',
        description: 'Retrieve a stored fact from memory',
        parameters: {
          key: 'user_preference',
          type: 'fact',
          explanation: 'Retrieving user preference to personalize response'
        },
        expected_result: 'The stored fact value'
      },
      {
        name: 'Retrieve pattern',
        description: 'Retrieve a learned pattern from memory',
        parameters: {
          key: 'command_pattern',
          type: 'pattern',
          explanation: 'Retrieving learned command pattern to improve command handling'
        },
        expected_result: 'The stored pattern information'
      }
    ];

    super(
      'retrieve_memory',
      'Retrieve information from memory by key and type.',
      'memory',
      '1.0.0',
      parameters,
      required,
      examples
    );
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { key, type } = args;

    try {
      const entries = await memoryManager.searchMemory(
        key as string,
        '',
        { type: type as string }
      );

      if (entries.length === 0) {
        return { found: false, message: 'No matching memory found' };
      }

      return {
        found: true,
        entries: entries.map(entry => ({
          content: entry.content,
          metadata: entry.metadata,
          timestamp: entry.timestamp
        }))
      };
    } catch (error) {
      throw new Error(`Failed to retrieve memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 