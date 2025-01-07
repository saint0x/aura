import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition } from '../../types';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export class WriteFileTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      relative_workspace_path: {
        type: 'string',
        description: 'The path of the file to write, relative to the workspace root.',
      required: true
        },
        content: {
        type: 'string',
        description: 'The content to write to the file.',
        required: true
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
        required: true
      }
    };

    const required = [
      'relative_workspace_path',
      'content',
      'explanation'
    ];

    const examples = [
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

    super(
      'write_file',
      'Write content to a file.',
      'file',
      '1.0.0',
      parameters,
      required,
      examples
    );
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { relative_workspace_path, content } = args;

    try {
      const filePath = join(process.cwd(), relative_workspace_path as string);
      await writeFile(filePath, content as string, 'utf-8');
      return { success: true, message: 'File written successfully' };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 