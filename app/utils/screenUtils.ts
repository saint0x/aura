import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { writeFile } from 'fs/promises';

const execAsync = promisify(exec);

interface CaptureOptions {
  area: string;
  format?: 'png' | 'jpg';
}

interface CaptureResult {
  path: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export async function captureScreen(options: CaptureOptions): Promise<CaptureResult> {
  const { area, format = 'png' } = options;
  const screencapturePath = '/usr/sbin/screencapture';
  const outputPath = join(process.cwd(), `screenshots/capture_${Date.now()}.${format}`);

  let command = `${screencapturePath}`;
  switch (area) {
    case 'window':
      command += ' -W';
      break;
    case 'selection':
      command += ' -s';
      break;
    case 'full':
    default:
      break;
  }

  command += ` "${outputPath}"`;

  try {
    await execAsync(command);
    
    // Get image dimensions using sips
    const { stdout } = await execAsync(`sips -g pixelHeight -g pixelWidth "${outputPath}"`);
    const dimensions = {
      width: parseInt(stdout.match(/pixelWidth: (\d+)/)?.[1] || '0'),
      height: parseInt(stdout.match(/pixelHeight: (\d+)/)?.[1] || '0')
    };

    return {
      path: outputPath,
      dimensions
    };
  } catch (error) {
    throw new Error(`Failed to capture screen: ${error instanceof Error ? error.message : String(error)}`);
  }
} 