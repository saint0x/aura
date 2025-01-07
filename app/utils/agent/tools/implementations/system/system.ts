import { BaseTool } from '../../baseTool';
import { ToolMetadata, ToolVerifier } from '../../types';
import { VerificationResult } from '../../verification';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';
import { commandManager, SYSTEM_COMMANDS, SYSTEM_CONCEPTS } from '../../../commandUtils';
import fs from 'fs/promises';
import path from 'path';

const execAsync = util.promisify(exec);

interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
    speed: number;
    usage: number;
    temperature?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    heapUsed: number;
    heapTotal: number;
  };
  os: {
    platform: string;
    release: string;
    arch: string;
    uptime: number;
  };
  network: {
    interfaces: string[];
    hostname: string;
  };
  disk: {
    total: number;
    free: number;
    used: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// Helper function to get sudo password from .env.local
async function getSudoPassword(): Promise<string> {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const match = envContent.match(/SUDO_PASSWORD=(.+)/);
    if (match) {
      return match[1];
    }
    throw new Error('SUDO_PASSWORD not found in .env.local');
  } catch (error) {
    throw new Error('Failed to read sudo password from .env.local');
  }
}

// Enhanced shell command executor with sudo support
async function executeShellCommand(command: string, requiresSudo: boolean = false): Promise<{ stdout: string; stderr: string }> {
  try {
    if (requiresSudo) {
      const sudoPassword = await getSudoPassword();
      if (command.startsWith('sudo ')) {
        command = `echo "${sudoPassword}" | sudo -S ${command.slice(5)}`;
      } else {
        command = `echo "${sudoPassword}" | sudo -S ${command}`;
      }
    }
    return await execAsync(command);
  } catch (error) {
    throw new Error(`Shell command failed: ${(error as Error).message}`);
  }
}

export class SystemTool extends BaseTool {
  readonly name = 'system';
  readonly description = 'Execute system commands and retrieve system information';
  readonly category = 'system';
  readonly version = '1.0.0';

  constructor() {
    super(
      'system',
      'Execute system commands and retrieve system information',
      'system',
      '1.0.0',
      {
        command: {
          type: 'string',
          description: 'The system command to execute. Can be a predefined command or shell command.',
          required: true
        },
        requiresSudo: {
          type: 'boolean',
          description: 'Whether the command requires sudo privileges',
          required: false
        },
        args: {
          type: 'object',
          description: 'Additional arguments for the command',
          required: false
        }
      },
      ['command'],
      [
        {
          name: 'getBatteryInfo',
          description: 'Get battery status on macOS',
          parameters: {
            command: 'pmset -g batt',
            requiresSudo: false
          },
          expected_result: 'Battery status information'
        },
        {
          name: 'getCpuTemperature',
          description: 'Get CPU temperature on macOS',
          parameters: {
            command: 'powermetrics --samplers smc -i1 -n1',
            requiresSudo: true
          },
          expected_result: 'CPU temperature information'
        },
        {
          name: 'getSystemLoad',
          description: 'Get system load information',
          parameters: {
            command: 'uptime',
            requiresSudo: false
          },
          expected_result: 'System load averages'
        }
      ]
    );
  }

  async handler(args: Record<string, unknown>): Promise<unknown> {
    try {
      const command = args.command as string;
      const requiresSudo = args.requiresSudo as boolean || false;

      // First try to normalize as a predefined command
      const normalizedCommand = commandManager.normalizeCommand(command, 'system');
      
      let result: unknown;
      
      if (normalizedCommand) {
        // Handle predefined commands
        result = await this.handlePredefinedCommand(normalizedCommand, args);
      } else {
        // Handle as shell command
        result = await this.handleShellCommand(command, requiresSudo);
      }

      // Ensure result is properly structured
      return {
        command,
        output: result,
        timestamp: new Date().toISOString(),
        source: 'system_tool',
        verification: {
          success: true,
          message: 'System command executed and verified',
          details: {
            tool: this.name,
            category: this.category,
            command,
            requiresSudo
          }
        }
      };
    } catch (error) {
      throw new Error(`System command failed: ${(error as Error).message}`);
    }
  }

  private async handlePredefinedCommand(command: string, args: Record<string, unknown>): Promise<unknown> {
    const info = await this.getSystemInfo();
    
    switch (command) {
      case 'info':
        return {
          platform: info.os.platform,
          release: info.os.release,
          arch: info.os.arch,
          hostname: info.network.hostname,
          uptime: info.os.uptime
        };
      case 'cpu':
        return info.cpu;
      case 'memory':
        return info.memory;
      case 'disk':
        return info.disk;
      case 'network':
        return info.network;
      case 'process':
        return info.process;
      case 'all':
        return info;
      default:
        throw new Error(`Unknown predefined command: ${command}`);
    }
  }

  private async handleShellCommand(command: string, requiresSudo: boolean): Promise<unknown> {
    // List of safe commands that don't require special handling
    const safeCommands = [
      'uptime',
      'pmset -g batt',
      'powermetrics --samplers smc',
      'system_profiler',
      'ps',
      'top',
      'df',
      'du',
      'free',
      'vmstat',
      'iostat',
      'netstat',
      'lsof',
      'w',
      'who',
      'last',
      'uname'
    ];

    // Check if command is safe or starts with a safe command
    const isSafe = safeCommands.some(safe => 
      command === safe || command.startsWith(`${safe} `)
    );

    if (!isSafe) {
      throw new Error(`Unsupported command: ${command}`);
    }

    const { stdout, stderr } = await executeShellCommand(command, requiresSudo);
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      command,
      timestamp: new Date().toISOString()
    };
  }

  private async getSystemInfo(): Promise<SystemInfo> {
    return {
      cpu: await this.getCpuInfo(),
      memory: await this.getMemoryInfo(),
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime()
      },
      network: {
        interfaces: Object.keys(os.networkInterfaces()),
        hostname: os.hostname()
      },
      disk: await this.getDiskInfo(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user
      }
    };
  }

  private async getCpuInfo(): Promise<SystemInfo['cpu']> {
    const startMeasure = os.cpus().map(cpu => cpu.times);
    await new Promise(resolve => setTimeout(resolve, 100));
    const endMeasure = os.cpus().map(cpu => cpu.times);
    
    const idleDifferences = endMeasure.map((end, i) => {
      const start = startMeasure[i];
      const idle = end.idle - start.idle;
      const total = Object.values(end).reduce((a, b) => a + b) - 
                   Object.values(start).reduce((a, b) => a + b);
      return 1 - idle / total;
    });
    
    const usage = (idleDifferences.reduce((a, b) => a + b) / idleDifferences.length) * 100;
    const cpuInfo = os.cpus()[0];

    return {
      model: cpuInfo.model,
      cores: os.cpus().length,
      speed: cpuInfo.speed,
      usage,
      temperature: await this.getCpuTemperature()
    };
  }

  private async getCpuTemperature(): Promise<number | undefined> {
    try {
      if (process.platform === 'darwin') {
        const { stdout } = await executeShellCommand('powermetrics --samplers smc -i1 -n1', true);
        const match = stdout.match(/CPU die temperature: (\d+\.\d+)/);
        return match ? parseFloat(match[1]) : undefined;
      } else if (process.platform === 'linux') {
        const { stdout } = await executeShellCommand('cat /sys/class/thermal/thermal_zone0/temp', true);
        return parseInt(stdout) / 1000;
      }
    } catch {
      return undefined;
    }
  }

  private async getMemoryInfo(): Promise<SystemInfo['memory']> {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const { heapUsed, heapTotal } = process.memoryUsage();

    return {
      total,
      free,
      used,
      heapUsed,
      heapTotal
    };
  }

  private async getDiskInfo(): Promise<SystemInfo['disk']> {
    if (process.platform === 'win32') {
      const { stdout } = await executeShellCommand('wmic logicaldisk get size,freespace,caption', false);
      // Parse Windows disk info
      return {
        total: 0,
        free: 0,
        used: 0
      };
    } else {
      const { stdout } = await executeShellCommand('df -k /', false);
      const lines = stdout.trim().split('\n');
      const [, info] = lines;
      const [, total, used, free] = info.split(/\s+/);
      return {
        total: parseInt(total) * 1024,
        free: parseInt(free) * 1024,
        used: parseInt(used) * 1024
      };
    }
  }

  // ... rest of the implementation methods ...
} 