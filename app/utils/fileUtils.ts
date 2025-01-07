import path from 'path';
import os from 'os';
import fs from 'fs';
import { ValidationError } from './common/errors';

export function getWorkspaceRoot(): string {
  return process.env.WORKSPACE_ROOT || process.cwd();
}

export function expandPath(inputPath: string): string {
  // Handle home directory
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  
  // Handle absolute paths
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  
  // Handle relative paths
  return path.join(getWorkspaceRoot(), inputPath);
}

export function validatePath(filePath: string, allowOutsideWorkspace: boolean = false): string {
  const normalizedPath = expandPath(filePath);
  
  // If outside workspace access is not allowed, check if path is within workspace
  if (!allowOutsideWorkspace && !normalizedPath.startsWith(getWorkspaceRoot())) {
    throw new ValidationError({
      message: 'File path must be within workspace root',
      param: 'path'
    });
  }

  return normalizedPath;
}

export function isPathAccessible(filePath: string): boolean {
  try {
    // Check if path exists and we have permission to access it
    const stats = fs.statSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export function getCommonDirectories(): string[] {
  return [
    os.homedir(),
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Downloads'),
    getWorkspaceRoot()
  ];
} 