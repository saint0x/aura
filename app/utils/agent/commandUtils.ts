import { ToolMetadata } from './types';
import { memoryManager } from '../memoryUtils';
import { MemoryType, MemoryEntry } from './types';

export interface Command {
  command: string;
  description: string;
  aliases?: string[];
  category: string;
  examples?: string[];
}

export interface LearnedCommand {
  original: string;
  normalized: string;
  category: string;
  frequency: number;
  lastUsed: Date;
  metadata?: Record<string, unknown>;
}

export interface CommandMap {
  [key: string]: Command;
}

export const SYSTEM_COMMANDS: CommandMap = {
  'info': {
    command: 'info',
    category: 'system',
    description: 'Get basic system information including OS, platform, architecture, and hostname',
    aliases: [
      'system info', 'about', 'system', 'os info', 'platform info',
      'system details', 'host info', 'machine info', 'environment',
      'system environment', 'system status', 'system overview'
    ]
  },
  'gpu': {
    command: 'gpu',
    category: 'system',
    description: 'Get detailed GPU information including usage, memory, and performance metrics',
    aliases: [
      'graphics', 'video card', 'graphics card', 'gpu info',
      'gpu usage', 'gpu stats', 'gpu memory', 'vram',
      'gpu performance', 'graphics performance', 'gpu load',
      'gpu utilization', 'gpu health', 'gpu monitoring',
      'graphics monitoring', 'display adapter', 'gpu temperature',
      'graphics memory', 'render device', 'compute device'
    ]
  },
  'cpu': {
    command: 'cpu',
    category: 'system',
    description: 'Get detailed CPU information including usage, temperature, cores, and model',
    aliases: [
      'cpu usage', 'processor', 'cpu info', 'cpu temp', 'cpu temperature',
      'processor info', 'cpu stats', 'processor usage', 'cpu load',
      'processor load', 'cpu utilization', 'cores', 'processor temperature',
      'cpu performance', 'processor performance', 'cpu health',
      'processor health', 'cpu monitoring', 'processor monitoring'
    ]
  },
  'memory': {
    command: 'memory',
    category: 'system',
    description: 'Get comprehensive memory usage information including RAM, swap, and heap',
    aliases: [
      'ram', 'memory usage', 'ram usage', 'memory info', 'ram info',
      'memory stats', 'ram stats', 'memory load', 'ram load',
      'memory utilization', 'ram utilization', 'memory health',
      'ram health', 'memory monitoring', 'ram monitoring',
      'swap', 'swap usage', 'heap', 'heap usage'
    ]
  },
  'disk': {
    command: 'disk',
    category: 'system',
    description: 'Get detailed disk usage and storage information for all mounted volumes',
    aliases: [
      'storage', 'disk usage', 'storage usage', 'disk info', 'storage info',
      'disk stats', 'storage stats', 'disk space', 'storage space',
      'disk utilization', 'storage utilization', 'disk health',
      'storage health', 'disk monitoring', 'storage monitoring',
      'drive', 'drive usage', 'drive info', 'drive stats',
      'filesystem', 'filesystem usage', 'volume', 'volume usage'
    ]
  },
  'network': {
    command: 'network',
    category: 'system',
    description: 'Get comprehensive network information including interfaces, connectivity, and bandwidth',
    aliases: [
      'net', 'connectivity', 'network info', 'network stats',
      'network usage', 'network load', 'network utilization',
      'network health', 'network monitoring', 'internet',
      'internet connection', 'bandwidth', 'network speed',
      'connection', 'connection status', 'network status',
      'internet status', 'network interfaces', 'network config'
    ]
  },
  'process': {
    command: 'process',
    category: 'system',
    description: 'Get detailed information about running processes including CPU and memory usage',
    aliases: [
      'processes', 'running', 'process info', 'process stats',
      'process usage', 'process load', 'process utilization',
      'process health', 'process monitoring', 'running processes',
      'active processes', 'task manager', 'tasks', 'running tasks',
      'background processes', 'system processes', 'applications'
    ]
  },
  'all': {
    command: 'all',
    category: 'system',
    description: 'Get comprehensive system information including all available metrics',
    aliases: [
      'everything', 'full', 'complete', 'comprehensive',
      'all info', 'all stats', 'all metrics', 'system all',
      'monitor all', 'all monitoring', 'full system',
      'complete info', 'system complete', 'system full'
    ]
  }
};

// Conceptual mappings for system operations
export const SYSTEM_CONCEPTS: Record<string, string[]> = {
  // High-level System Understanding
  'anything computer related': ['info', 'all'],
  'anything about this machine': ['info', 'all'],
  'anything about system state': ['info', 'all'],
  'anything about computer health': ['cpu', 'memory', 'disk', 'network', 'gpu'],
  'anything about performance': ['cpu', 'memory', 'process', 'gpu'],
  
  // Component Categories
  'computation related': ['cpu', 'gpu', 'process'],
  'storage related': ['memory', 'disk'],
  'communication related': ['network'],
  'graphics related': ['gpu'],
  'processing related': ['cpu', 'process', 'gpu'],
  
  // State and Performance
  'resource state': ['cpu', 'memory', 'disk', 'gpu'],
  'system load': ['cpu', 'memory', 'process'],
  'bottlenecks': ['cpu', 'memory', 'disk', 'network', 'gpu'],
  'performance problems': ['cpu', 'memory', 'process', 'gpu'],
  
  // Monitoring and Analysis
  'usage patterns': ['process', 'cpu', 'memory'],
  'resource consumption': ['cpu', 'memory', 'disk', 'gpu'],
  'system analytics': ['all'],
  'performance metrics': ['cpu', 'memory', 'disk', 'network', 'gpu'],
  
  // Hardware Specifics
  'processor details': ['cpu'],
  'memory details': ['memory'],
  'storage details': ['disk'],
  'network details': ['network'],
  'graphics details': ['gpu'],
  
  // System Health
  'system vitals': ['cpu', 'memory', 'disk', 'network'],
  'hardware health': ['cpu', 'memory', 'disk', 'gpu'],
  'connection health': ['network'],
  'process health': ['process', 'cpu', 'memory'],
  
  // Operational Aspects
  'running software': ['process'],
  'active programs': ['process'],
  'background tasks': ['process'],
  'system processes': ['process'],
  
  // Resource Management
  'memory management': ['memory', 'process'],
  'disk space': ['disk'],
  'processing power': ['cpu', 'gpu'],
  'network bandwidth': ['network'],
  
  // User Experience
  'system responsiveness': ['cpu', 'memory', 'process'],
  'graphics performance': ['gpu'],
  'storage speed': ['disk'],
  'connection speed': ['network'],
  
  // Diagnostic Categories
  'hardware diagnostics': ['cpu', 'memory', 'disk', 'gpu'],
  'software diagnostics': ['process'],
  'network diagnostics': ['network'],
  'performance diagnostics': ['all'],
  
  // Meta Categories
  'system overview': ['info', 'all'],
  'detailed analysis': ['all'],
  'quick check': ['info'],
  'deep inspection': ['all'],
  
  // Composite Concepts
  'gaming performance': ['cpu', 'gpu', 'memory'],
  'web browsing': ['network', 'memory', 'process'],
  'file operations': ['disk', 'memory'],
  'multimedia': ['gpu', 'memory', 'process'],
  
  // State Changes
  'performance changes': ['cpu', 'memory', 'process', 'gpu'],
  'system changes': ['all'],
  'usage trends': ['process', 'cpu', 'memory', 'disk'],
  'health trends': ['all']
};

export const MEMORY_COMMANDS: CommandMap = {
  'store': {
    command: 'store',
    category: 'memory',
    description: 'Store new information in memory with metadata, context, and relationships',
    aliases: [
      'save', 'remember', 'memorize', 'record', 'keep',
      'note', 'write', 'add to memory', 'preserve',
      'save to memory', 'store info', 'remember this',
      'make note', 'take note', 'save for later',
      'commit to memory', 'log', 'archive', 'document'
    ]
  },
  'retrieve': {
    command: 'retrieve',
    category: 'memory',
    description: 'Retrieve stored information from memory with context and metadata filtering',
    aliases: [
      'recall', 'get', 'fetch', 'recover', 'access',
      'read', 'load', 'find', 'get from memory',
      'remember', 'recollect', 'bring back', 'access memory',
      'retrieve info', 'get info', 'recall info',
      'memory lookup', 'lookup', 'read memory'
    ]
  },
  'search': {
    command: 'search',
    category: 'memory',
    description: 'Search through memory using advanced queries, patterns, and semantic matching',
    aliases: [
      'find', 'query', 'look up', 'scan', 'browse',
      'search memory', 'memory search', 'find in memory',
      'locate', 'search for', 'seek', 'explore memory',
      'investigate', 'analyze memory', 'memory analysis',
      'deep search', 'pattern search', 'semantic search'
    ]
  },
  'pattern': {
    command: 'pattern',
    category: 'memory',
    description: 'Work with memory patterns, identify trends, and analyze recurring information',
    aliases: [
      'patterns', 'learn', 'analyze patterns', 'find patterns',
      'pattern recognition', 'trend analysis', 'trends',
      'pattern matching', 'pattern learning', 'memory patterns',
      'recurring patterns', 'pattern detection', 'detect patterns',
      'pattern analytics', 'pattern insights', 'memory trends'
    ]
  },
  'forget': {
    command: 'forget',
    category: 'memory',
    description: 'Remove specific information from memory with precise control',
    aliases: [
      'delete', 'remove', 'clear', 'erase', 'purge',
      'forget info', 'delete from memory', 'remove memory',
      'clear memory', 'erase memory', 'memory cleanup',
      'cleanup', 'memory purge', 'memory clear',
      'memory removal', 'memory delete'
    ]
  },
  'summarize': {
    command: 'summarize',
    category: 'memory',
    description: 'Generate summaries of stored memory information and patterns',
    aliases: [
      'summary', 'digest', 'brief', 'overview', 'recap',
      'memory summary', 'summarize memory', 'memory digest',
      'memory overview', 'memory recap', 'memory brief',
      'memory analysis', 'analyze memory', 'memory insights',
      'memory report', 'report'
    ]
  }
};

// Conceptual mappings for memory operations
export const MEMORY_CONCEPTS: Record<string, string[]> = {
  // High-level Memory Understanding
  'anything about past information': ['retrieve', 'search', 'pattern'],
  'anything previously discussed': ['retrieve', 'search'],
  'anything we talked about': ['retrieve', 'search'],
  'anything you remember': ['retrieve', 'search', 'pattern'],
  'anything you learned': ['retrieve', 'pattern'],
  
  // Memory Operations
  'remember this': ['store'],
  'dont forget this': ['store'],
  'keep this in mind': ['store'],
  'make a note of': ['store'],
  'save for later': ['store'],
  
  // Recall Operations
  'what do you remember about': ['retrieve', 'search'],
  'have we discussed': ['search'],
  'find previous mentions of': ['search'],
  'when did we talk about': ['search'],
  'show me previous': ['retrieve', 'search'],
  
  // Pattern Recognition
  'how does this relate': ['pattern'],
  'find connections to': ['pattern', 'search'],
  'any similar discussions': ['pattern', 'search'],
  'what patterns exist': ['pattern'],
  'analyze relationships': ['pattern'],
  
  // Memory Management
  'clean up old': ['forget'],
  'remove outdated': ['forget'],
  'clear previous': ['forget'],
  'update information': ['store', 'forget'],
  'refresh memory': ['store', 'forget'],
  
  // Analysis Operations
  'give me an overview': ['summarize'],
  'what have we covered': ['summarize', 'pattern'],
  'show me the big picture': ['summarize', 'pattern'],
  'analyze our discussion': ['pattern', 'summarize'],
  'what are the key points': ['summarize'],
  
  // Temporal Concepts
  'recent discussions': ['retrieve', 'search'],
  'older conversations': ['retrieve', 'search'],
  'earlier mentions': ['search'],
  'latest information': ['retrieve'],
  'historical context': ['pattern', 'search'],
  
  // Context Operations
  'in what context': ['search', 'pattern'],
  'related topics': ['pattern', 'search'],
  'surrounding discussion': ['retrieve', 'search'],
  'broader context': ['pattern', 'summarize'],
  'specific details': ['retrieve', 'search'],
  
  // Learning Patterns
  'what have you learned': ['pattern', 'summarize'],
  'how has this evolved': ['pattern'],
  'track changes': ['pattern', 'search'],
  'development over time': ['pattern', 'summarize'],
  'progress so far': ['summarize', 'pattern'],
  
  // Meta Memory
  'memory health': ['pattern', 'summarize'],
  'memory organization': ['pattern'],
  'memory structure': ['pattern'],
  'memory efficiency': ['forget', 'pattern'],
  'memory status': ['pattern', 'summarize']
};

export const REASONING_COMMANDS: CommandMap = {
  'start': {
    command: 'start',
    category: 'reasoning',
    description: 'Start a new reasoning chain with context and objectives',
    aliases: [
      'begin', 'initialize', 'create chain', 'new chain',
      'start reasoning', 'begin reasoning', 'init chain',
      'create reasoning', 'new reasoning', 'start thinking',
      'begin analysis', 'start analysis', 'initiate',
      'commence', 'start process', 'begin process'
    ]
  },
  'add_step': {
    command: 'add_step',
    category: 'reasoning',
    description: 'Add a new step to the reasoning chain with detailed analysis',
    aliases: [
      'step', 'think', 'add thought', 'next step',
      'continue', 'proceed', 'advance', 'progress',
      'add reasoning', 'reason', 'analyze', 'evaluate',
      'consider', 'contemplate', 'process', 'examine',
      'investigate', 'study', 'assess'
    ]
  },
  'conclude': {
    command: 'conclude',
    category: 'reasoning',
    description: 'Conclude a reasoning chain with final insights and conclusions',
    aliases: [
      'finish', 'end', 'complete', 'finalize',
      'conclude chain', 'end chain', 'finish chain',
      'complete analysis', 'conclude reasoning',
      'end reasoning', 'finish reasoning', 'wrap up',
      'summarize', 'conclude analysis', 'final step'
    ]
  },
  'validate': {
    command: 'validate',
    category: 'reasoning',
    description: 'Validate reasoning steps and check logical consistency',
    aliases: [
      'check', 'verify', 'test', 'confirm',
      'validate reasoning', 'check reasoning',
      'verify steps', 'validate steps', 'check logic',
      'verify logic', 'validate logic', 'proof',
      'verification', 'confirmation', 'quality check'
    ]
  },
  'branch': {
    command: 'branch',
    category: 'reasoning',
    description: 'Create a new branch in the reasoning chain for alternative analysis',
    aliases: [
      'fork', 'split', 'diverge', 'alternate',
      'branch chain', 'fork chain', 'split reasoning',
      'alternative', 'new branch', 'create branch',
      'branch off', 'divergent thinking', 'parallel',
      'parallel thinking', 'alternative path'
    ]
  },
  'merge': {
    command: 'merge',
    category: 'reasoning',
    description: 'Merge multiple reasoning branches into a unified analysis',
    aliases: [
      'combine', 'join', 'unify', 'consolidate',
      'merge branches', 'combine chains', 'join reasoning',
      'unify analysis', 'consolidate thinking',
      'synthesize', 'integrate', 'bring together',
      'converge', 'reconcile', 'harmonize'
    ]
  }
};

// Conceptual mappings for reasoning operations
export const REASONING_CONCEPTS: Record<string, string[]> = {
  // General Reasoning
  'anything about thinking': ['start', 'add_step', 'conclude'],
  'anything about analysis': ['start', 'add_step', 'validate'],
  'anything about problem solving': ['start', 'add_step', 'branch', 'merge'],
  
  // Process Control
  'how to think about this': ['start', 'add_step'],
  'explore possibilities': ['branch', 'add_step'],
  'combine thoughts': ['merge', 'conclude'],
  
  // Validation and Quality
  'check my thinking': ['validate'],
  'verify reasoning': ['validate'],
  'ensure quality': ['validate', 'merge'],
  
  // Existing mappings...
  'thinking': ['start', 'add_step', 'conclude'],
  'analysis': ['start', 'add_step', 'validate'],
  'logic': ['validate', 'add_step']
};

export const FILE_COMMANDS: CommandMap = {
  'read': {
    command: 'read',
    category: 'file',
    description: 'Read contents from a file with support for partial reads and summaries',
    aliases: [
      'read file', 'open', 'view', 'show', 'display',
      'cat', 'read contents', 'view file', 'show file',
      'display file', 'file contents', 'read text',
      'view contents', 'show contents', 'get contents',
      'fetch file', 'load file', 'examine file'
    ]
  },
  'write': {
    command: 'write',
    category: 'file',
    description: 'Write or update content in a file with automatic backup',
    aliases: [
      'write file', 'save', 'create', 'update', 'modify',
      'save file', 'create file', 'update file',
      'write contents', 'save contents', 'write text',
      'save text', 'modify file', 'edit file',
      'change file', 'store file', 'output file'
    ]
  },
  'browse': {
    command: 'browse',
    category: 'file',
    description: 'Browse and explore directory structure with smart suggestions',
    aliases: [
      'browse files', 'list', 'ls', 'dir', 'directory',
      'list files', 'show files', 'browse directory',
      'explore files', 'list directory', 'show directory',
      'file browser', 'file explorer', 'browse folder',
      'list folder', 'show folder', 'folder contents'
    ]
  },
  'delete': {
    command: 'delete',
    category: 'file',
    description: 'Safely delete files with optional backup',
    aliases: [
      'delete file', 'remove', 'rm', 'erase', 'trash',
      'remove file', 'erase file', 'trash file',
      'delete files', 'remove files', 'clean up',
      'cleanup files', 'purge files', 'eliminate file',
      'destroy file', 'wipe file'
    ]
  }
};

// Conceptual mappings for file operations
export const FILE_CONCEPTS: Record<string, string[]> = {
  // General File Operations
  'anything about files': ['read', 'write', 'browse', 'delete'],
  'anything about directories': ['browse'],
  'anything about file system': ['browse', 'read'],
  
  // File Management
  'how to manage files': ['browse', 'delete', 'write'],
  'file organization': ['browse', 'delete'],
  'file cleanup': ['delete'],
  
  // Content Operations
  'work with file contents': ['read', 'write'],
  'file modifications': ['write', 'delete'],
  
  // Existing mappings...
  'reading': ['read', 'browse'],
  'writing': ['write'],
  'browsing': ['browse']
};

export const SCREEN_COMMANDS: CommandMap = {
  'capture': {
    command: 'capture',
    category: 'screen',
    description: 'Capture screen content with region selection and format options',
    aliases: [
      'screenshot', 'screen capture', 'capture screen',
      'take screenshot', 'screen shot', 'snap',
      'screen snap', 'capture image', 'screen image',
      'grab screen', 'screen grab', 'capture window',
      'window capture', 'capture area', 'area capture',
      'screen region', 'capture region'
    ]
  }
};

// Conceptual mappings for screen operations
export const SCREEN_CONCEPTS: Record<string, string[]> = {
  // General Screen Operations
  'anything about screenshots': ['capture'],
  'anything about screen capture': ['capture'],
  'anything visual': ['capture'],
  
  // Purpose-based
  'save what I see': ['capture'],
  'capture screen content': ['capture'],
  'document visually': ['capture'],
  
  // Existing mappings...
  'screenshot': ['capture'],
  'imaging': ['capture'],
  'recording': ['capture']
};

export const VOICE_COMMANDS: CommandMap = {
  'transcribe': {
    command: 'transcribe',
    category: 'voice',
    description: 'Transcribe audio content to text with language detection',
    aliases: [
      'transcribe audio', 'speech to text', 'convert audio',
      'audio transcription', 'voice to text', 'transcribe voice',
      'convert speech', 'audio to text', 'voice transcription',
      'speech transcription', 'transcribe speech', 'convert voice',
      'voice recognition', 'speech recognition', 'audio recognition'
    ]
  }
};

// Conceptual mappings for voice operations
export const VOICE_CONCEPTS: Record<string, string[]> = {
  // General Voice Operations
  'anything about voice': ['transcribe'],
  'anything about speech': ['transcribe'],
  'anything about audio': ['transcribe'],
  
  // Purpose-based
  'convert speaking to text': ['transcribe'],
  'understand speech': ['transcribe'],
  'process audio': ['transcribe'],
  
  // Existing mappings...
  'transcription': ['transcribe'],
  'conversion': ['transcribe'],
  'recognition': ['transcribe']
};

export const COMMAND_CATEGORIES = {
  system: SYSTEM_COMMANDS,
  memory: MEMORY_COMMANDS,
  reasoning: REASONING_COMMANDS,
  file: FILE_COMMANDS,
  screen: SCREEN_COMMANDS,
  voice: VOICE_COMMANDS
};

export class CommandManager {
  private initialized = false;
  private memoryStorage: typeof memoryManager | null = null;
  private availableCommands: Map<string, Command> = new Map();
  private commandCategories: Map<string, Map<string, Command>> = new Map();

  constructor() {
    // Initialize command categories
    Object.entries(COMMAND_CATEGORIES).forEach(([category, commands]) => {
      const categoryMap = new Map<string, Command>();
      Object.values(commands).forEach(cmd => {
        categoryMap.set(cmd.command, cmd);
        this.availableCommands.set(cmd.command, cmd);
      });
      this.commandCategories.set(category, categoryMap);
    });
  }

  async initialize(storage?: typeof memoryManager): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (storage) {
        this.memoryStorage = storage;
        await this.memoryStorage.searchMemory('system', '', { type: 'COMMAND' as MemoryType });
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize command manager:', error);
      // Continue without memory storage in static generation
      this.initialized = true;
    }
  }

  async getLearnedCommands(): Promise<LearnedCommand[]> {
    if (!this.memoryStorage) {
      return [];
    }

    try {
      const entries = await this.memoryStorage.searchMemory('system', '', {
        type: 'COMMAND' as MemoryType,
        limit: 100
      });

      return entries
        .filter((entry: MemoryEntry): entry is MemoryEntry & { content: LearnedCommand } => 
          typeof entry.content === 'object' && 
          entry.content !== null && 
          'original' in entry.content &&
          'normalized' in entry.content
        )
        .map(entry => entry.content)
        .sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.warn('Failed to get learned commands:', error);
      return [];
    }
  }

  getAvailableCommands(category?: string): string[] {
    if (category) {
      const categoryCommands = this.commandCategories.get(category);
      return categoryCommands ? Array.from(categoryCommands.keys()) : [];
    }
    return Array.from(this.availableCommands.keys());
  }

  normalizeCommand(input: string, category?: string): string | null {
    const normalizedInput = input.toLowerCase().trim();
    
    // Check standard commands first
    if (category) {
      const categoryCommands = this.commandCategories.get(category);
      if (categoryCommands) {
        for (const [cmd, info] of categoryCommands) {
          if (cmd === normalizedInput || info.aliases?.includes(normalizedInput)) {
            return cmd;
          }
        }
      }
      return null;
    }

    // Check all categories
    for (const commands of this.commandCategories.values()) {
      for (const [cmd, info] of commands) {
        if (cmd === normalizedInput || info.aliases?.includes(normalizedInput)) {
          return cmd;
        }
      }
    }

    return null;
  }

  getCommandInfo(command: string, category?: string): Command | null {
    if (category) {
      const categoryCommands = this.commandCategories.get(category);
      return categoryCommands?.get(command) || null;
    }
    return this.availableCommands.get(command) || null;
  }

  validateCommand(command: string, category?: string): boolean {
    return this.normalizeCommand(command, category) !== null;
  }

  async learnCommand(input: string, normalized: string, category: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.memoryStorage) {
      return;
    }

    try {
      const command: LearnedCommand = {
        original: input,
        normalized,
        category,
        frequency: 1,
        lastUsed: new Date(),
        metadata
      };

      await this.memoryStorage.store(
        'system',
        `Learned command pattern: ${input} → ${normalized}`,
        'COMMAND' as MemoryType,
        command as unknown as Record<string, unknown>
      );
    } catch (error) {
      console.warn('Failed to learn command:', error);
    }
  }
}

// Export singleton instance
export const commandManager = new CommandManager(); 