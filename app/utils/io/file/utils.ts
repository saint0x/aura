import fs from 'fs/promises';
import path from 'path';

const ROOT_DIR = '/workspaces/aura';

export async function createFile(filePath: string, content: string): Promise<string> {
  const fullPath = path.join(ROOT_DIR, filePath);
  await fs.writeFile(fullPath, content);
  return `File created successfully at ${fullPath}`;
}

export async function readFile(filePath: string): Promise<string> {
  const fullPath = path.join(ROOT_DIR, filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
}

export async function deleteFile(filePath: string): Promise<string> {
  const fullPath = path.join(ROOT_DIR, filePath);
  await fs.unlink(fullPath);
  return `File deleted successfully at ${fullPath}`;
}

export async function listFiles(directory: string): Promise<string[]> {
  const fullPath = path.join(ROOT_DIR, directory);
  const files = await fs.readdir(fullPath);
  return files;
}