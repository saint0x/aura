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

class PromptManager {
  // Use Maps for O(1) lookups
  private prompts: Map<string, string> = new Map();
  private toolInstances: Map<string, any> = new Map();
  private initialized: boolean = false;

  // Lazy load tools only when needed
  private getToolInstance(name: string): any {
    if (this.toolInstances.has(name)) {
      return this.toolInstances.get(name);
    }

    let tool;
    switch (name) {
      case 'read_file':
        tool = new ReadFileTool();
        break;
      case 'browse_filesystem':
        tool = new BrowseFilesystemTool();
        break;
      case 'screen_capture':
        tool = new ScreenCaptureTool();
        break;
      case 'transcribe_audio':
        tool = new TranscribeAudioTool();
        break;
      case 'store_memory':
        tool = new StoreMemoryTool();
        break;
      case 'retrieve_memory':
        tool = new RetrieveMemoryTool();
        break;
      case 'search_memory':
        tool = new SearchMemoryTool();
        break;
      case 'reasoning_chain':
        tool = new ReasoningChainTool();
        break;
      case 'system':
        tool = new SystemTool();
        break;
      default:
        return null;
    }

    this.toolInstances.set(name, tool);
    return tool;
  }

  // Initialize tools only once
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register core tools - O(1) operations
    const coreTools = [
      'read_file',
      'browse_filesystem',
      'screen_capture',
      'transcribe_audio',
      'store_memory',
      'retrieve_memory',
      'search_memory',
      'reasoning_chain',
      'system'
    ];

    // Parallel tool registration
    await Promise.all(coreTools.map(async (name) => {
      const tool = this.getToolInstance(name);
      if (tool) {
        toolRegistry.register(tool);
      }
    }));

    this.initialized = true;
  }

  // O(1) prompt lookup
  getPrompt(name: string): string | undefined {
    return this.prompts.get(name);
  }

  // O(1) prompt registration
  registerPrompt(name: string, prompt: string): void {
    this.prompts.set(name, prompt);
  }

  // O(1) prompt existence check
  hasPrompt(name: string): boolean {
    return this.prompts.has(name);
  }

  // O(1) clear specific prompt
  clearPrompt(name: string): void {
    this.prompts.delete(name);
  }

  // O(1) clear all prompts
  clearAllPrompts(): void {
    this.prompts.clear();
  }
}

// Singleton instance
export const promptManager = new PromptManager(); 