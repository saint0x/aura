import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition } from '../../types';
import { memoryManager } from '@/app/utils/memoryUtils';
import { MemoryType } from '@/app/utils/agent/types';

export class StoreMemoryTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      key: {
        type: 'string',
        description: 'The key to store the memory under.',
        required: true
      },
      content: {
        type: 'string',
        description: 'The content to store in memory.',
        required: true
      },
      type: {
        type: 'string',
        description: 'The type of memory to store.',
        required: true,
        enum: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata to store with the memory.',
        required: false
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
        required: true
      }
    };

    const required = ['key', 'content', 'type', 'explanation'];

    const examples = [
      {
        name: 'Store fact',
        description: 'Store a new fact in memory',
        parameters: {
          key: 'user_preference',
          content: 'User prefers dark mode',
          type: 'fact',
          metadata: { source: 'user_input', confidence: 0.9 },
          explanation: 'Storing user preference for future reference'
        },
        expected_result: 'Memory stored successfully'
      },
      {
        name: 'Store pattern',
        description: 'Store a learned pattern',
        parameters: {
          key: 'command_pattern',
          content: 'Users often use "temp" as shorthand for "temperature"',
          type: 'pattern',
          metadata: { frequency: 5, last_seen: '2024-01-07' },
          explanation: 'Recording observed command pattern to improve future interactions'
        },
        expected_result: 'Pattern stored successfully'
      }
    ];

    super(
      'store_memory',
      'Store new information in memory.',
      'memory',
      '1.0.0',
      parameters,
      required,
      examples
    );
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { key, content, type, metadata } = args;

    try {
      await memoryManager.store(
        key as string,
        content as string,
        type as MemoryType,
        metadata as Record<string, unknown>
      );

      return {
        success: true,
        message: 'Memory stored successfully',
        key,
        type
      };
    } catch (error) {
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 