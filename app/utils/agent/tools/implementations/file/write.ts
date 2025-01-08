import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export class WriteFileTool extends BaseTool {
  public readonly name = 'write_file';
  public readonly description = 'Write content to a file.';
  public readonly version = '1.0.0';
  public readonly category = 'file';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'relative_workspace_path',
      type: 'string',
      description: 'The path of the file to write, relative to the workspace root.',
      required: true
    },
    {
      name: 'content',
      type: 'string',
      description: 'The content to write to the file.',
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
        description: 'The path of the file to write, relative to the workspace root.'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file.'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['relative_workspace_path', 'content', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Write new file',
      description: 'Write content to a new file',
      parameters: {
        relative_workspace_path: 'src/example.ts',
        content: 'console.log("Hello, World!");',
        explanation: 'Creating a new example file to demonstrate functionality'
      },
      expected_result: 'File written successfully'
    },
    {
      name: 'Update existing file',
      description: 'Update content in an existing file',
      parameters: {
        relative_workspace_path: 'config.json',
        content: '{"setting": "value"}',
        explanation: 'Updating configuration file with new settings'
      },
      expected_result: 'File updated successfully'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { relative_workspace_path, content } = args;

    if (typeof relative_workspace_path !== 'string' || typeof content !== 'string') {
      throw new Error('relative_workspace_path and content must be strings');
    }

    try {
      const filePath = join(process.cwd(), relative_workspace_path);
      await writeFile(filePath, content, 'utf-8');
      
      return {
        success: true,
        result: {
          path: relative_workspace_path,
          message: 'File written successfully'
        }
      };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 