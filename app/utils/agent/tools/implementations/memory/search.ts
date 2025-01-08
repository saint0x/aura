import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { memoryManager } from '@/app/utils/memoryUtils';

export class SearchMemoryTool extends BaseTool {
  public readonly name = 'search_memory';
  public readonly description = 'Search for information in memory';
  public readonly version = '1.0.0';
  public readonly category = 'memory';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'query',
      type: 'string',
      description: 'The search query.',
      required: true
    },
    {
      name: 'type',
      type: 'string',
      description: 'The type of memory to search for.',
      required: false,
      validation: [{
        type: 'enum',
        values: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      }]
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Additional metadata to filter by.',
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
      query: {
        type: 'string',
        description: 'The search query.'
      },
      type: {
        type: 'string',
        description: 'The type of memory to search for.',
        enum: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata to filter by.'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['query', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Search facts',
      description: 'Search for facts in memory',
      parameters: {
        query: 'user preferences',
        type: 'fact',
        explanation: 'Looking up stored user preferences'
      },
      expected_result: 'Array of matching memory entries'
    },
    {
      name: 'Search patterns',
      description: 'Search for learned patterns',
      parameters: {
        query: 'command usage',
        type: 'pattern',
        metadata: { confidence: { min: 0.8 } },
        explanation: 'Finding high-confidence command patterns'
      },
      expected_result: 'Array of matching patterns'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { query, type, metadata = {} } = args;

    if (typeof query !== 'string') {
      throw new Error('query must be a string');
    }

    try {
      const results = await memoryManager.searchMemory(
        query,
        (type as string) || '',
        metadata as Record<string, unknown>
      );

      return {
        success: true,
        result: {
          query,
          type,
          matches: results
        }
      };
    } catch (error) {
      throw new Error(`Failed to search memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 