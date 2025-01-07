import { toolRegistry } from './agent/tools/registry';
import { ReadFileTool } from './agent/tools/implementations/file/read';
import { BrowseFilesystemTool } from './agent/tools/implementations/file/browse';
import { ScreenCaptureTool } from './agent/tools/implementations/screen/capture';
import { TranscribeAudioTool } from './agent/tools/implementations/voice/transcribe';
import { StoreMemoryTool } from './agent/tools/implementations/memory/store';
import { RetrieveMemoryTool } from './agent/tools/implementations/memory/retrieve';
import { SearchMemoryTool } from './agent/tools/implementations/memory/search';
import { ReasoningChainTool } from './agent/tools/implementations/memory/reasoning';
import { SystemTool } from './agent/tools/implementations/system/system';

export class PromptManager {
  private static instance: PromptManager;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  private registerTools(): void {
    const tools = [
      new ReadFileTool(),
      new BrowseFilesystemTool(),
      new ScreenCaptureTool(),
      new TranscribeAudioTool(),
      new StoreMemoryTool(),
      new RetrieveMemoryTool(),
      new SearchMemoryTool(),
      new ReasoningChainTool(),
      new SystemTool()
    ];

    // Register tools if they haven't been registered yet
    const registeredTools = toolRegistry.list();
    const registeredToolNames = new Set(registeredTools.map(tool => tool.name));

    for (const tool of tools) {
      if (!registeredToolNames.has(tool.name)) {
        toolRegistry.register(tool);
      }
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Register all tools
    this.registerTools();

    this.initialized = true;
  }

  public getSystemPrompt(): string {
    if (!this.initialized) {
      throw new Error('PromptManager not initialized. Call initialize() first.');
    }

    const tools = toolRegistry.list();
    if (tools.length === 0) {
      throw new Error('No tools registered. Make sure initialize() was called.');
    }

    // Build system prompt using available tools
    return `You are an AI assistant with access to the following tools:\n\n${
      tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')
    }`;
  }
}

// Export singleton instance
export const promptManager = PromptManager.getInstance(); 