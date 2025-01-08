import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class ReadFileTool extends BaseTool {
  public readonly name = 'read_file';
  public readonly description = 'Read the contents of a file.';
  public readonly version = '1.0.0';
  public readonly category = 'file';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'relative_workspace_path',
      type: 'string',
      description: 'The path of the file to read, relative to the workspace root.',
      required: true
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
      relative_workspace_path: {
        type: 'string',
        description: 'The path of the file to read, relative to the workspace root.'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['relative_workspace_path', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Read text file',
      description: 'Read the contents of a text file',
      parameters: {
        relative_workspace_path: 'src/example.txt',
        explanation: 'Reading file contents to analyze code'
      },
      expected_result: 'File contents as string'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { relative_workspace_path } = args;

    if (typeof relative_workspace_path !== 'string') {
      throw new Error('relative_workspace_path must be a string');
    }

    try {
      const filePath = join(process.cwd(), relative_workspace_path);
      const content = await readFile(filePath, 'utf-8');
      
      return {
        success: true,
        result: {
          content,
          path: relative_workspace_path
        }
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 