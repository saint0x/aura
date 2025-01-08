import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { memoryManager } from '@/app/utils/memoryUtils';

export class RetrieveMemoryTool extends BaseTool {
  public readonly name = 'retrieve_memory';
  public readonly description = 'Retrieve specific memory by key';
  public readonly version = '1.0.0';
  public readonly category = 'memory';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'key',
      type: 'string',
      description: 'The key of the memory to retrieve.',
      required: true
    },
    {
      name: 'type',
      type: 'string',
      description: 'The type of memory to retrieve.',
      required: false,
      validation: [{
        type: 'enum',
        values: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      }]
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
        description: 'The key of the memory to retrieve.'
      },
      type: {
        type: 'string',
        description: 'The type of memory to retrieve.',
        enum: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['key', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Retrieve fact',
      description: 'Retrieve a specific fact from memory',
      parameters: {
        key: 'user_preference_theme',
        type: 'fact',
        explanation: 'Getting user theme preference'
      },
      expected_result: 'Memory entry for the specified key'
    },
    {
      name: 'Retrieve conclusion',
      description: 'Retrieve a reasoning conclusion',
      parameters: {
        key: 'task_123_conclusion',
        type: 'conclusion',
        explanation: 'Getting previous task conclusion'
      },
      expected_result: 'Memory entry containing the conclusion'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { key, type } = args;

    if (typeof key !== 'string') {
      throw new Error('key must be a string');
    }

    try {
      const memory = await memoryManager.retrieve(key);

      if (!memory) {
        return {
          success: false,
          result: {
            key,
            type,
            message: 'Memory not found'
          }
        };
      }

      return {
        success: true,
        result: {
          key,
          type,
          memory
        }
      };
    } catch (error) {
      throw new Error(`Failed to retrieve memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 