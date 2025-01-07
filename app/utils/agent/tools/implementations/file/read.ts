import { BaseTool } from '../../baseTool';
import { ToolParameterDefinition } from '../../types';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class ReadFileTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      relative_workspace_path: {
        type: 'string',
        description: 'The path of the file to read, relative to the workspace root.',
        required: true
      },
      should_read_entire_file: {
        type: 'boolean',
        description: 'Whether to read the entire file. Defaults to false.',
        required: true
      },
      start_line_one_indexed: {
        type: 'number',
        description: 'The one-indexed line number to start reading from (inclusive).',
        required: true
      },
      end_line_one_indexed_inclusive: {
        type: 'number',
        description: 'The one-indexed line number to end reading at (inclusive).',
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
      'should_read_entire_file',
      'start_line_one_indexed',
      'end_line_one_indexed_inclusive',
      'explanation'
    ];

    const examples = [
      {
        name: 'Read entire file',
        description: 'Read the entire contents of a file',
        parameters: {
          relative_workspace_path: 'src/main.ts',
          should_read_entire_file: true,
          start_line_one_indexed: 1,
          end_line_one_indexed_inclusive: 1,
          explanation: 'Reading the main file to understand the application entry point'
        },
        expected_result: 'File contents as string'
      },
      {
        name: 'Read specific lines',
        description: 'Read specific lines from a file',
        parameters: {
          relative_workspace_path: 'src/utils.ts',
          should_read_entire_file: false,
          start_line_one_indexed: 10,
          end_line_one_indexed_inclusive: 20,
          explanation: 'Reading utility functions to understand implementation details'
        },
        expected_result: 'Selected lines from file'
      }
    ];

    super(
      'read_file',
      'Read the contents of a file.',
      'file',
      '1.0.0',
      parameters,
      required,
      examples
    );
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const {
      relative_workspace_path,
      should_read_entire_file,
      start_line_one_indexed,
      end_line_one_indexed_inclusive
    } = args;

    try {
      const filePath = join(process.cwd(), relative_workspace_path as string);
      const content = await readFile(filePath, 'utf-8');

      if (should_read_entire_file) {
        return content;
      }

      const lines = content.split('\n');
      const start = Math.max(0, (start_line_one_indexed as number) - 1);
      const end = Math.min(lines.length, end_line_one_indexed_inclusive as number);

      return lines.slice(start, end).join('\n');
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 