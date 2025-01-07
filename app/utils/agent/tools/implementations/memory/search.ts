import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition } from '../../types';
import { memoryManager } from '@/app/utils/memoryUtils';

export class SearchMemoryTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      query: {
        type: 'string',
        description: 'The search query to find relevant memories.',
        required: true
      },
      type: {
        type: 'string',
        description: 'The type of memory to search for.',
        required: false,
        enum: ['pattern', 'fact', 'reasoning_step', 'conclusion', 'command']
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return.',
        required: false
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
        required: true
      }
    };

    const required = ['query', 'explanation'];

    const examples = [
      {
        name: 'Search facts',
        description: 'Search for facts about a specific topic',
        parameters: {
          query: 'user preferences',
          type: 'fact',
          limit: 5,
          explanation: 'Searching for user preferences to personalize response'
        },
        expected_result: 'Array of matching memory entries'
      },
      {
        name: 'Search all types',
        description: 'Search across all memory types',
        parameters: {
          query: 'file operations',
          limit: 10,
          explanation: 'Gathering context about previous file operations'
        },
        expected_result: 'Array of matching memory entries of any type'
      }
    ];

    super(
      'search_memory',
      'Search through memory using a query string.',
      'memory',
      '1.0.0',
      parameters,
      required,
      examples
    );
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { query, type, limit } = args;

    try {
      const entries = await memoryManager.searchMemory(
        query as string,
        '',
        {
          type: type as string | undefined,
          limit: limit as number | undefined
        }
      );

      return {
        found: entries.length > 0,
        count: entries.length,
        entries: entries.map(entry => ({
          content: entry.content,
          type: entry.type,
          metadata: entry.metadata,
          timestamp: entry.timestamp
        }))
      };
    } catch (error) {
      throw new Error(`Failed to search memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 