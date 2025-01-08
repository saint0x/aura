import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample, MemoryType } from '@/app/utils/agent/types';
import { memoryManager } from '@/app/utils/memoryUtils';

export class StoreMemoryTool extends BaseTool {
  public readonly name = 'store_memory';
  public readonly description = 'Store information in memory with metadata';
  public readonly version = '1.0.0';
  public readonly category = 'memory';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'key',
      type: 'string',
      description: 'The key to store the memory under.',
      required: true
    },
    {
      name: 'content',
      type: 'string',
      description: 'The content to store in memory.',
      required: true
    },
    {
      name: 'type',
      type: 'string',
      description: 'The type of memory to store.',
      required: true,
      validation: [{
        type: 'enum',
        values: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      }]
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Additional metadata to store with the memory.',
      required: false
    },
    {
      name: 'explanation',
      type: 'string',
      description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
      required: true
    }
  ];

  public readonly metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    category: this.category,
    version: this.version,
    parameters: {
      key: {
        type: 'string',
        description: 'The key to store the memory under.'
      },
      content: {
        type: 'string',
        description: 'The content to store in memory.'
      },
      type: {
        type: 'string',
        description: 'The type of memory to store.',
        enum: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata to store with the memory.'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['key', 'content', 'type', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Store fact',
      description: 'Store a fact in memory',
      parameters: {
        key: 'user_preference',
        content: 'User prefers dark mode',
        type: 'fact',
        explanation: 'Storing user preference for future reference'
      },
      expected_result: 'Memory stored successfully'
    },
    {
      name: 'Store pattern',
      description: 'Store a learned pattern',
      parameters: {
        key: 'command_pattern',
        content: 'Users often use "show" instead of "list"',
        type: 'pattern',
        metadata: { confidence: 0.8 },
        explanation: 'Recording observed command usage pattern'
      },
      expected_result: 'Pattern stored successfully'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { key, content, type, metadata = {} } = args;

    if (typeof key !== 'string' || typeof content !== 'string' || typeof type !== 'string') {
      throw new Error('key, content, and type must be strings');
    }

    try {
      await memoryManager.store(
        key,
        content,
        type as MemoryType,
        metadata as Record<string, unknown>
      );

      return {
        success: true,
        result: {
          key,
          type,
          message: 'Memory stored successfully'
        }
      };
    } catch (error) {
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 