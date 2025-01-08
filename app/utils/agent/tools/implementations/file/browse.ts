import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export class BrowseFilesystemTool extends BaseTool {
  public readonly name = 'browse_filesystem';
  public readonly description = 'Browse and list files in the filesystem';
  public readonly version = '1.0.0';
  public readonly category = 'file';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to browse',
      required: true
    },
    {
      name: 'pattern',
      type: 'string',
      description: 'File pattern to match (e.g., *.ts)',
      required: false
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'Whether to search recursively',
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
      path: {
        type: 'string',
        description: 'Directory path to browse'
      },
      pattern: {
        type: 'string',
        description: 'File pattern to match (e.g., *.ts)'
      },
      recursive: {
        type: 'boolean',
        description: 'Whether to search recursively'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['path', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'List directory',
      description: 'List files in a directory',
      parameters: {
        path: 'src',
        explanation: 'Browsing source directory to find relevant files'
      },
      expected_result: 'Array of file and directory information'
    },
    {
      name: 'Search TypeScript files',
      description: 'Find TypeScript files recursively',
      parameters: {
        path: 'src',
        pattern: '*.ts',
        recursive: true,
        explanation: 'Finding all TypeScript files for analysis'
      },
      expected_result: 'Array of TypeScript files'
    }
  ];

  private async listFiles(dirPath: string, pattern?: string, recursive = false): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    const files = await readdir(dirPath);

    for (const file of files) {
      const fullPath = join(dirPath, file);
      const stats = await stat(fullPath);
      const relativePath = relative(process.cwd(), fullPath);

      if (stats.isDirectory() && recursive) {
        results.push({
          name: file,
          path: relativePath,
          type: 'directory',
          modified: stats.mtime
        });
        results.push(...await this.listFiles(fullPath, pattern, recursive));
      } else {
        if (!pattern || file.match(new RegExp(pattern.replace('*', '.*')))) {
          results.push({
            name: file,
            path: relativePath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    }

    return results;
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { path, pattern, recursive = false } = args;

    if (typeof path !== 'string') {
      throw new Error('path must be a string');
    }

    if (pattern !== undefined && typeof pattern !== 'string') {
      throw new Error('pattern must be a string');
    }

    if (recursive !== undefined && typeof recursive !== 'boolean') {
      throw new Error('recursive must be a boolean');
    }

    try {
      const files = await this.listFiles(path, pattern, recursive);

      return {
        success: true,
        result: {
          path,
          pattern,
          recursive,
          files
        }
      };
    } catch (error) {
      throw new Error(`Failed to browse filesystem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 