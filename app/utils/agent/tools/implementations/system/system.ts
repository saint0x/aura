import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SystemTool extends BaseTool {
  public readonly name = 'system';
  public readonly description = 'Execute system commands and get system information';
  public readonly version = '1.0.0';
  public readonly category = 'system';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'command',
      type: 'string',
      description: 'The system command to execute',
      required: true
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Command timeout in milliseconds',
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
      command: {
        type: 'string',
        description: 'The system command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Command timeout in milliseconds'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['command', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Get system info',
      description: 'Get basic system information',
      parameters: {
        command: 'uname -a',
        explanation: 'Getting system information to check compatibility'
      },
      expected_result: 'System information output'
    },
    {
      name: 'Check disk space',
      description: 'Check available disk space',
      parameters: {
        command: 'df -h',
        explanation: 'Checking disk space for resource management'
      },
      expected_result: 'Disk space information'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { command, timeout = 30000 } = args;

    if (typeof command !== 'string') {
      throw new Error('command must be a string');
    }

    if (timeout !== undefined && typeof timeout !== 'number') {
      throw new Error('timeout must be a number');
    }

    try {
      const { stdout, stderr } = await execAsync(command, { timeout });
      
      return {
        success: true,
        result: {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          command
        }
      };
    } catch (error) {
      throw new Error(`Failed to execute command: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 