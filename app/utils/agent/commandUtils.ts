import { Command } from './types';

// Command concepts for each category
export const FILE_CONCEPTS = {
  read: ['view', 'show', 'display', 'get', 'fetch', 'load', 'examine'],
  write: ['save', 'create', 'update', 'modify', 'edit', 'change', 'store'],
  browse: ['list', 'explore', 'show', 'view', 'display', 'find', 'search']
};

export const SYSTEM_CONCEPTS = {
  execute: ['run', 'start', 'launch', 'perform', 'do', 'invoke'],
  monitor: ['watch', 'observe', 'track', 'check', 'inspect', 'analyze'],
  configure: ['setup', 'set', 'change', 'modify', 'update', 'adjust']
};

export const MEMORY_CONCEPTS = {
  store: ['save', 'remember', 'keep', 'record', 'memorize', 'note'],
  retrieve: ['recall', 'get', 'fetch', 'find', 'search', 'lookup'],
  forget: ['remove', 'delete', 'clear', 'erase', 'purge', 'drop']
};

export const REASONING_CONCEPTS = {
  analyze: ['think', 'consider', 'evaluate', 'assess', 'examine'],
  decide: ['choose', 'select', 'pick', 'determine', 'conclude'],
  plan: ['prepare', 'organize', 'arrange', 'structure', 'design']
};

export const SCREEN_CONCEPTS = {
  capture: ['screenshot', 'snap', 'grab', 'take', 'record'],
  analyze: ['scan', 'inspect', 'examine', 'check', 'review'],
  monitor: ['watch', 'observe', 'track', 'follow', 'detect']
};

export const VOICE_CONCEPTS = {
  transcribe: ['convert', 'write', 'translate', 'record', 'document'],
  speak: ['say', 'tell', 'vocalize', 'pronounce', 'utter'],
  listen: ['hear', 'record', 'capture', 'detect', 'recognize']
};

// Command maps for O(1) lookups
const FILE_COMMANDS: Map<string, Command> = new Map([
  ['read', {
    id: 'read',
    name: 'read',
    command: 'read',
    category: 'file',
    description: 'Read file contents',
    aliases: ['cat', 'view', 'show'],
    parameters: {
      path: { type: 'string', description: 'File path' }
    },
    examples: ['read file.txt', 'cat config.json'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }],
  ['write', {
    id: 'write',
    name: 'write',
    command: 'write',
    category: 'file',
    description: 'Write content to a file',
    aliases: ['save', 'create', 'update'],
    parameters: {
      path: { type: 'string', description: 'File path' },
      content: { type: 'string', description: 'Content to write' }
    },
    examples: ['write file.txt "Hello"', 'save config.json {...}'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }]
]);

const SYSTEM_COMMANDS: Map<string, Command> = new Map([
  ['status', {
    id: 'status',
    name: 'status',
    command: 'status',
    category: 'system',
    description: 'Get system status',
    aliases: ['health', 'info'],
    parameters: {},
    examples: ['status', 'health check'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }]
]);

const MEMORY_COMMANDS: Map<string, Command> = new Map([
  ['remember', {
    id: 'remember',
    name: 'remember',
    command: 'remember',
    category: 'memory',
    description: 'Store information in memory',
    aliases: ['store', 'save', 'memorize'],
    parameters: {
      content: { type: 'string', description: 'Content to remember' }
    },
    examples: ['remember "Important note"'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }]
]);

const REASONING_COMMANDS: Map<string, Command> = new Map([
  ['think', {
    id: 'think',
    name: 'think',
    command: 'think',
    category: 'reasoning',
    description: 'Start a reasoning chain',
    aliases: ['reason', 'analyze'],
    parameters: {
      task: { type: 'string', description: 'Task to reason about' }
    },
    examples: ['think "How to solve this problem"'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }]
]);

const SCREEN_COMMANDS: Map<string, Command> = new Map([
  ['capture', {
    id: 'capture',
    name: 'capture',
    command: 'capture',
    category: 'screen',
    description: 'Capture screen content',
    aliases: ['screenshot', 'snap'],
    parameters: {
      area: { type: 'string', description: 'Area to capture' }
    },
    examples: ['capture full', 'screenshot window'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }]
]);

const VOICE_COMMANDS: Map<string, Command> = new Map([
  ['speak', {
    id: 'speak',
    name: 'speak',
    command: 'speak',
    category: 'voice',
    description: 'Convert text to speech',
    aliases: ['say', 'tts'],
    parameters: {
      text: { type: 'string', description: 'Text to speak' }
    },
    examples: ['speak "Hello"', 'say "Welcome"'],
    metadata: {},
    created_at: Date.now(),
    updated_at: Date.now()
  }]
]);

// Export command categories
export const COMMAND_CATEGORIES = {
  file: FILE_COMMANDS,
  system: SYSTEM_COMMANDS,
  memory: MEMORY_COMMANDS,
  reasoning: REASONING_COMMANDS,
  screen: SCREEN_COMMANDS,
  voice: VOICE_COMMANDS
};

export interface LearnedCommand {
  original: string;
  normalized: string;
  category: string;
  frequency: number;
  lastUsed: Date;
  metadata?: Record<string, unknown>;
}

// Pre-compile command patterns for O(1) matching
const COMMAND_PATTERNS = {
  file: /^(read|write|browse|delete|copy|move|rename|list|search)(\s|$)/i,
  system: /^(exec|run|start|stop|restart|install|uninstall|update|configure)(\s|$)/i,
  memory: /^(store|retrieve|search|forget|remember|recall|memorize)(\s|$)/i,
  screen: /^(capture|record|screenshot|scan|analyze|detect)(\s|$)/i,
  voice: /^(transcribe|speak|listen|record|play|pause|stop)(\s|$)/i
};

class CommandManager {
  private commandCache: Map<string, Map<string, Command>> = new Map();
  private aliasCache: Map<string, string> = new Map();
  private learnedCommands: Map<string, LearnedCommand> = new Map();

  constructor() {
    this.buildAliasCache();
  }

  private buildAliasCache(): void {
    Object.values(COMMAND_CATEGORIES).forEach(commandMap => {
      commandMap.forEach((cmd, name) => {
        cmd.aliases.forEach(alias => {
          this.aliasCache.set(alias.toLowerCase(), name);
        });
      });
    });
  }

  getCommandInfo(command: string, category: string): Command | null {
    const normalizedCommand = this.normalizeCommand(command);
    if (!normalizedCommand) return null;

    const categoryCommands = this.getCategoryCommands(category);
    return categoryCommands?.get(normalizedCommand) || null;
  }

  validateCommand(command: string, category: string): boolean {
    const pattern = COMMAND_PATTERNS[category as keyof typeof COMMAND_PATTERNS];
    if (!pattern) return false;
    return pattern.test(command);
  }

  normalizeCommand(command: string, category?: string): string | null {
    const normalized = command.toLowerCase().trim();
    
    // If category is provided, check category-specific patterns first
    if (category) {
      const pattern = COMMAND_PATTERNS[category as keyof typeof COMMAND_PATTERNS];
      if (pattern && !pattern.test(normalized)) {
        return null;
      }
    }
    
    return this.aliasCache.get(normalized) || null;
  }

  private getCategoryCommands(category: string): Map<string, Command> | null {
    if (this.commandCache.has(category)) {
      return this.commandCache.get(category)!;
    }

    const commands = COMMAND_CATEGORIES[category as keyof typeof COMMAND_CATEGORIES];
    if (commands) {
      this.commandCache.set(category, commands);
    }

    return commands || null;
  }

  getAvailableCommands(category: keyof typeof COMMAND_CATEGORIES): string[] {
    const commands = this.getCategoryCommands(category);
    return commands ? Array.from(commands.keys()) : [];
  }

  async getLearnedCommands(): Promise<LearnedCommand[]> {
    return Array.from(this.learnedCommands.values());
  }

  async learnCommand(
    original: string,
    normalized: string,
    category: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const key = `${original}:${category}`;
    const existing = this.learnedCommands.get(key);
    
    if (existing) {
      existing.frequency += 1;
      existing.lastUsed = new Date();
      existing.metadata = { ...existing.metadata, ...metadata };
    } else {
      this.learnedCommands.set(key, {
        original,
        normalized,
        category,
        frequency: 1,
        lastUsed: new Date(),
        metadata
      });
    }
  }

  clearCategoryCache(category: string): void {
    this.commandCache.delete(category);
  }

  async initialize(memoryManager: any): Promise<void> {
    // Clear existing caches
    this.commandCache.clear();
    this.aliasCache.clear();
    
    // Rebuild alias cache
    this.buildAliasCache();
    
    // Load learned commands from memory if available
    try {
      const learnedCommands = await memoryManager.searchMemory('', '', {
        type: 'command'
      });
      
      learnedCommands.forEach((cmd: { metadata: Record<string, unknown> }) => {
        if (cmd.metadata) {
          this.learnedCommands.set(`${cmd.metadata.original}:${cmd.metadata.category}`, {
            original: cmd.metadata.original as string,
            normalized: cmd.metadata.normalized as string,
            category: cmd.metadata.category as string,
            frequency: (cmd.metadata.frequency as number) || 1,
            lastUsed: new Date(cmd.metadata.lastUsed as string),
            metadata: cmd.metadata
          });
        }
      });
    } catch (error) {
      console.warn('Failed to load learned commands:', error);
    }
  }

  reset(): void {
    this.commandCache.clear();
    this.aliasCache.clear();
    this.learnedCommands.clear();
    this.buildAliasCache();
  }
}

export const commandManager = new CommandManager(); 