import { MemoryType, ReasoningStep } from '../types';
import { memoryManager } from '../../memoryUtils';
import { commandManager, COMMAND_CATEGORIES, LearnedCommand, Command } from '../commandUtils';

export interface ChainOfThoughtContext {
  sessionId: string;
  userId: string;
  chainId?: string;
  metadata?: Record<string, unknown>;
}

export interface ThoughtStep {
  type: ReasoningStep['type'];
  content: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  commands?: {
    original: string;
    normalized: string;
    valid: boolean;
  }[];
  toolExecutions?: {
    tool: string;
    result: unknown;
    success: boolean;
    timestamp: Date;
  }[];
}

// Base prompt without dynamic command categories
export const BASE_CHAIN_OF_THOUGHT_PROMPT = `
You are an AI assistant that engages in extremely thorough, self-questioning reasoning. Your approach mirrors human stream-of-consciousness thinking, characterized by continuous exploration, self-doubt, and iterative analysis.

CORE PRINCIPLES:

1. EXPLORATION OVER CONCLUSION
- Never rush to conclusions
- Keep exploring until a solution emerges naturally from the evidence
- If uncertain, continue reasoning indefinitely
- Question every assumption and inference

2. DEPTH OF REASONING
- Break down complex thoughts into simple, atomic steps
- Express thoughts in natural, conversational internal monologue
- Show work-in-progress thinking
- Embrace uncertainty and revision of previous thoughts

3. THINKING PROCESS
- Use short, simple sentences that mirror natural thought patterns
- Express uncertainty and internal debate freely
- Show work-in-progress thinking
- Acknowledge and explore dead ends
- Frequently backtrack and revise

4. TOOL VERIFICATION
- MUST verify every factual claim with appropriate tools
- NEVER proceed without tool verification if a tool exists
- Question whether each step requires tool usage
- If uncertain about tool availability, MUST check first
- ALL system-related information MUST come from tools
- If a required tool is missing, MUST acknowledge this explicitly
- Chain multiple tools together to verify complex claims
- Record and reference tool execution results

Your output must follow this exact structure:

<observation>
[Initial observations about the current context]
- What tools might be relevant?
- What do I need to verify with tools?
- What tool results already exist?
- What tool chains might I need?
</observation>

<verification>
[Tool usage planning and verification]
- List required tool verifications
- Plan tool execution sequence
- Note existing tool results
- Identify missing tool capabilities
</verification>

<exploration>
[Deep dive into the problem space]
- Break down the problem into smaller parts
- Question each assumption
- Consider multiple angles
- Look for patterns and relationships
- Identify useful commands and tools
</exploration>

<reasoning>
[Step-by-step thought process]
- Start with foundational thoughts
- Build up complexity gradually
- Show uncertainty and revisions
- Link to previous insights
- Plan command sequences
</reasoning>

<validation>
[Critical examination of conclusions]
- Question each conclusion
- Look for potential flaws
- Consider edge cases
- Validate assumptions
- Verify command choices
</validation>

<synthesis>
[Bringing it all together]
- Summarize key insights
- Highlight remaining uncertainties
- Suggest next steps
- Note areas for future exploration
- Document command patterns
</synthesis>

<conclusion>
[Final thoughts and recommendations]
- Clear, actionable conclusions
- Confidence levels
- Alternative approaches
- Open questions
- Command execution plan
</conclusion>
`;

// Function to get command categories section
function getCommandCategoriesSection(): string {
  try {
    return `
5. COMMAND AWARENESS
You have access to the following command categories:

${Object.entries(COMMAND_CATEGORIES)
  .map(([category, commands]) => `
${category.toUpperCase()} COMMANDS:
${Object.values(commands as Record<string, Command>)
  .map((cmd: Command) => `- ${cmd.command}: ${cmd.description}
  Aliases: ${cmd.aliases?.join(', ') || 'none'}`)
  .join('\n')}
`).join('\n')}

When using commands:
- Always use the normalized command form
- Consider command aliases for better understanding
- Validate commands before use
- Use the most appropriate command for each task
- Chain commands when needed for complex operations
`;
  } catch (error) {
    console.warn('Failed to get command categories:', error);
    return '';
  }
}

export class ChainOfThought {
  private context: ChainOfThoughtContext;
  private toolExecutions: Map<string, {
    result: unknown;
    success: boolean;
    timestamp: Date;
  }> = new Map();

  constructor(context: ChainOfThoughtContext) {
    this.context = context;
  }

  recordToolExecution(tool: string, result: unknown, success: boolean): void {
    this.toolExecutions.set(tool, {
      result,
      success,
      timestamp: new Date()
    });
  }

  getToolExecutionResult(tool: string): unknown | null {
    return this.toolExecutions.get(tool)?.result ?? null;
  }

  hasToolBeenExecuted(tool: string): boolean {
    return this.toolExecutions.has(tool);
  }

  static async getPrompt(variables: Record<string, unknown> = {}): Promise<string> {
    let prompt = BASE_CHAIN_OF_THOUGHT_PROMPT;
    
    try {
      // Try to add command categories if available
      const commandSection = getCommandCategoriesSection();
      if (commandSection) {
        prompt = prompt.replace('4. MEMORY INTEGRATION', `4. MEMORY INTEGRATION\n\n${commandSection}`);
      }

      // Try to add learned commands if memory is available
      const learnedCommands = await commandManager.getLearnedCommands().catch(() => []);
      const enhancedVariables = {
        ...variables,
        available_commands: commandManager.getAvailableCommands(),
        command_categories: Object.keys(COMMAND_CATEGORIES),
        learned_commands: learnedCommands.map((cmd) => 
          `${cmd.original} → ${cmd.normalized} (used ${cmd.frequency} times)`
        )
      };
      
      // Replace any variables in the prompt
      Object.entries(enhancedVariables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      });
    } catch (error) {
      // If command manager or memory isn't initialized, just use the base prompt with available variables
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      });
    }

    return prompt;
  }

  async startChain(task: string): Promise<string> {
    const chainId = crypto.randomUUID();
    await memoryManager.store(
      this.context.sessionId,
      `Starting new reasoning chain: ${task}`,
      'reasoning_step' as MemoryType,
      {
        chain_id: chainId,
        user_id: this.context.userId,
        task,
        available_commands: commandManager.getAvailableCommands(),
        ...this.context.metadata
      }
    );
    this.context.chainId = chainId;
    return chainId;
  }

  async addThought(step: ThoughtStep): Promise<void> {
    if (!this.context.chainId) {
      throw new Error('Chain not initialized. Call startChain first.');
    }

    // Extract and validate commands from the thought
    const commands = await extractCommands(step.content);
    const validatedCommands = await Promise.all(commands.map(async (cmd: string) => {
      const normalized = commandManager.normalizeCommand(cmd);
      const valid = normalized !== null;
      
      // Learn successful command patterns
      if (valid && normalized) {
        const category = commandManager.getCommandInfo(normalized)?.category || 'unknown';
        await commandManager.learnCommand(cmd, normalized, category, {
          chain_id: this.context.chainId,
          context: this.context.metadata,
          confidence: step.confidence
        });
      }

      return {
        original: cmd,
        normalized: normalized || cmd,
        valid
      };
    }));

    // Add tool executions to the thought step
    const toolExecutions = Array.from(this.toolExecutions.entries()).map(([tool, execution]) => ({
      tool,
      result: execution.result,
      success: execution.success,
      timestamp: execution.timestamp
    }));

    await memoryManager.store(
      this.context.sessionId,
      step.content,
      'reasoning_step' as MemoryType,
      {
        chain_id: this.context.chainId,
        step_type: step.type,
        confidence: step.confidence,
        commands: validatedCommands,
        toolExecutions,
        ...step.metadata
      }
    );
  }

  async conclude(conclusion: string, confidence: number): Promise<void> {
    if (!this.context.chainId) {
      throw new Error('Chain not initialized. Call startChain first.');
    }

    await memoryManager.store(
      this.context.sessionId,
      conclusion,
      'conclusion' as MemoryType,
      {
        chain_id: this.context.chainId,
        confidence,
        ...this.context.metadata
      }
    );
  }

  async getChainSteps(): Promise<ReasoningStep[]> {
    if (!this.context.chainId) {
      throw new Error('Chain not initialized. Call startChain first.');
    }

    const entries = await memoryManager.searchMemory(
      this.context.sessionId,
      '',
      {
        metadata: { chain_id: this.context.chainId },
        type: 'reasoning_step'
      }
    );

    return entries.map(entry => ({
      type: entry.metadata?.step_type as ReasoningStep['type'],
      content: entry.content,
      metadata: entry.metadata
    }));
  }

  async getConclusion(): Promise<string | null> {
    if (!this.context.chainId) {
      throw new Error('Chain not initialized. Call startChain first.');
    }

    const entries = await memoryManager.searchMemory(
      this.context.sessionId,
      '',
      {
        metadata: { chain_id: this.context.chainId },
        type: 'conclusion'
      }
    );

    return entries.length > 0 ? entries[0].content : null;
  }
}

// Helper function to extract potential commands from text
async function extractCommands(text: string): Promise<string[]> {
  // Enhanced regex to catch more natural language patterns
  const commandRegex = /\b\w+(?:\s+(?:usage|info|status|check|running|hot|\w+))*\b/g;
  const matches = text.match(commandRegex) || [];
  
  try {
    const learnedCommands = await commandManager.getLearnedCommands().catch(() => []);
    return matches.filter((match) => 
      commandManager.validateCommand(match) || 
      learnedCommands.some((cmd) => cmd.original === match.toLowerCase())
    );
  } catch (error) {
    // If memory isn't initialized, just use basic command validation
    return matches.filter((match) => commandManager.validateCommand(match));
  }
}

// Export factory function
export const chainOfThought = (context: ChainOfThoughtContext) => new ChainOfThought(context); 