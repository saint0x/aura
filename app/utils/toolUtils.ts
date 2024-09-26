import fs from 'fs/promises';
import path from 'path';

const ROOT_DIR = process.cwd();

async function findFile(filePath: string): Promise<string> {
  const possiblePaths = [
    path.join(ROOT_DIR, filePath),
    path.join(ROOT_DIR, 'app', filePath),
    path.join(ROOT_DIR, 'app', 'utils', filePath),
    path.join(ROOT_DIR, 'utils', filePath)
  ];

  for (const fullPath of possiblePaths) {
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch (error) {
      // File not found in this path, continue to the next
    }
  }

  throw new Error(`File not found: ${filePath}`);
}

export async function executeTool(toolRequest: string): Promise<string> {
  try {
    const { function: funcName, parameters } = JSON.parse(toolRequest);

    switch (funcName) {
      case 'createFile':
        return await createFile(parameters.path, parameters.content);
      case 'readFile':
        return await readFile(parameters.path);
      case 'deleteFile':
        return await deleteFile(parameters.path);
      case 'listFiles':
        return await listFiles(parameters.directory);
      case 'captureScreenshot':
        return await captureScreenshot();
      default:
        throw new Error(`Unknown function: ${funcName}`);
    }
  } catch (error) {
    return JSON.stringify({ success: false, error: `Error executing tool: ${error}` });
  }
}

async function createFile(filePath: string, content: string): Promise<string> {
  const fullPath = await findFile(filePath).catch(() => path.join(ROOT_DIR, filePath));
  await fs.writeFile(fullPath, content);
  return JSON.stringify({ success: true, result: `File created successfully at ${fullPath}` });
}

async function readFile(filePath: string): Promise<string> {
  const fullPath = await findFile(filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return JSON.stringify({ success: true, result: content });
}

async function deleteFile(filePath: string): Promise<string> {
  const fullPath = await findFile(filePath);
  await fs.unlink(fullPath);
  return JSON.stringify({ success: true, result: `File deleted successfully at ${fullPath}` });
}

async function listFiles(directory: string): Promise<string> {
  const fullPath = await findFile(directory).catch(() => path.join(ROOT_DIR, directory));
  const files = await fs.readdir(fullPath);
  return JSON.stringify({ success: true, result: files });
}

async function captureScreenshot(): Promise<string> {
  // This is a placeholder. The actual implementation should be in the API route.
  return JSON.stringify({ success: true, result: "Screenshot captured. Implement in API route." });
}