import fs from 'fs';
import path from 'path';

interface ToolLogEntry {
  timestamp: string;
  tool: string;
  parameters: Record<string, unknown>;
  status: 'success' | 'error';
  result?: unknown;
  error?: {
    message: string;
    stack?: string;
  };
  duration: number;
}

class ToolLogger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'tool-usage.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(entry: ToolLogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date(entry.timestamp).toISOString()
    }) + '\n';
  }

  public async logToolUsage(
    tool: string,
    parameters: Record<string, unknown>,
    startTime: number,
    status: 'success' | 'error',
    result?: unknown,
    error?: Error
  ) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    const logEntry: ToolLogEntry = {
      timestamp: new Date().toISOString(),
      tool,
      parameters,
      status,
      duration,
      ...(status === 'success' && { result }),
      ...(status === 'error' && {
        error: {
          message: error?.message || 'Unknown error',
          stack: error?.stack
        }
      })
    };

    try {
      await fs.promises.appendFile(
        this.logFile,
        this.formatLogEntry(logEntry)
      );
      
      // Also log to console for immediate visibility
      console.log(
        `[${logEntry.timestamp}] ${tool} - ${status.toUpperCase()} (${duration}ms)`,
        status === 'error' ? `\nError: ${error?.message}` : ''
      );
    } catch (err) {
      console.error('Failed to write tool log:', err);
    }
  }

  public async getRecentLogs(limit = 100): Promise<ToolLogEntry[]> {
    try {
      const fileContent = await fs.promises.readFile(this.logFile, 'utf-8');
      return fileContent
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
        .slice(-limit);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }
}

// Export singleton instance
export const toolLogger = new ToolLogger(); 