import { BaseTool } from '../../baseTool';
import { ValidationError } from '@/app/common/errors';
import { ToolMetadata, ToolParameterDefinition } from '../../types';
import fs from 'fs';
import path from 'path';
import { expandPath, isPathAccessible, getCommonDirectories } from '@/app/utils/fileUtils';

interface FileSystemEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
}

export class BrowseFilesystemTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      path: {
        type: 'string',
        description: 'The directory path to browse. Use ~ for home directory (e.g., ~/Desktop, ~/Documents), absolute paths (/Users/name/folder), or relative paths (./folder). Always returns live directory contents.',
        required: true
      }
    };

    const required = ['path'];

    const examples = [
      {
        name: 'Browse Desktop',
        description: 'List the current contents of the Desktop directory',
        parameters: {
          path: '~/Desktop'
        },
        expected_result: 'Live array of files and directories currently on the Desktop'
      },
      {
        name: 'Browse Documents',
        description: 'List the current contents of the Documents directory',
        parameters: {
          path: '~/Documents'
        },
        expected_result: 'Live array of files and directories currently in Documents'
      },
      {
        name: 'Browse Current Directory',
        description: 'List contents of the current working directory in real-time',
        parameters: {
          path: '.'
        },
        expected_result: 'Live array of files and directories in the current directory'
      },
      {
        name: 'Browse with Fallback',
        description: 'Attempt to browse a directory, with helpful suggestions if not accessible',
        parameters: {
          path: '~/Projects'
        },
        expected_result: 'Either live directory contents or suggestions for accessible directories'
      }
    ];

    super(
      'browse_filesystem',
      'Browse and explore the live directory structure of the computer. Can access any directory including Desktop, Documents, Downloads, and the current workspace. Returns real-time directory contents and suggests accessible paths.',
      'file',
      '1.0.0',
      parameters,
      required,
      examples
    );
  }

  private getFileStats(entryPath: string): FileSystemEntry {
    const stats = fs.statSync(entryPath);
    return {
      name: path.basename(entryPath),
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.isFile() ? stats.size : undefined,
      lastModified: stats.mtime
    };
  }

  public async handler(params: Record<string, unknown>): Promise<unknown> {
    const requestedPath = params.path;
    if (typeof requestedPath !== 'string') {
      throw new ValidationError({
        message: 'path must be a string',
        param: 'path'
      });
    }

    try {
      // Expand and normalize the path
      const normalizedPath = expandPath(requestedPath);

      // Check if path exists and is accessible
      if (!isPathAccessible(normalizedPath)) {
        // If path is not accessible, return common directories
        return {
          error: `Path ${normalizedPath} is not accessible`,
          suggestion: 'Try one of these common directories:',
          common_directories: getCommonDirectories()
        };
      }

      // Check if path is a directory
      const stats = fs.statSync(normalizedPath);
      if (!stats.isDirectory()) {
        throw new ValidationError({
          message: 'Path must be a directory',
          param: 'path'
        });
      }

      // Read directory contents
      const entries = fs.readdirSync(normalizedPath);
      const contents: FileSystemEntry[] = [];

      for (const entry of entries) {
        try {
          const entryPath = path.join(normalizedPath, entry);
          if (isPathAccessible(entryPath)) {
            contents.push(this.getFileStats(entryPath));
          }
        } catch (error) {
          // Skip entries that can't be accessed
          console.warn(`Skipping inaccessible entry: ${entry}`);
        }
      }

      return {
        path: normalizedPath,
        contents,
        parent: path.dirname(normalizedPath),
        common_directories: getCommonDirectories()
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError({
        message: `Failed to read directory: ${(error as Error).message}`,
        param: 'path'
      });
    }
  }
} 