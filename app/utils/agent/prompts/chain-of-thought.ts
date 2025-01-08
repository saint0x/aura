import { MemoryType, ThoughtStep, Command } from '../types';
import { memoryManager } from '../../memoryUtils';
import { commandManager, COMMAND_CATEGORIES } from '../commandUtils';

export interface ChainOfThoughtContext {
  sessionId: string;
  userId: string;
  chainId?: string;
  metadata?: Record<string, unknown>;
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

4. TOOL VERIFICATION AND CHAINING
- MUST verify every factual claim with appropriate tools
- MUST explicitly assess if task requires single or multiple tool calls
- MUST chain tools together for complex operations
- NEVER proceed without tool verification if a tool exists
- Question whether each step requires tool usage
- If uncertain about tool availability, MUST check first
- ALL system-related information MUST come from tools
- If a required tool is missing, MUST acknowledge this explicitly
- Chain multiple tools together to verify complex claims
- Record and reference tool execution results
- NEVER skip tool execution - always execute tools before proceeding

Your output must follow this exact structure:

<observation>
[Initial observations about the current context]
- What tools might be relevant?
- What do I need to verify with tools?
- What tool results already exist?
- What tool chains might I need?
- Does this task require single or multiple tool calls?
</observation>

<verification>
[Tool usage planning and verification]
- List required tool verifications
- Plan tool execution sequence
- Note existing tool results
- Identify missing tool capabilities
- Specify if tools need to be chained
</verification>

<exploration>
[Deep dive into the problem space]
- Break down the problem into smaller parts
- Question each assumption
- Consider multiple angles
- Look for patterns and relationships
- Identify useful commands and tools
- Plan tool chaining if needed
</exploration>

<reasoning>
[Step-by-step thought process]
- Start with foundational thoughts
- Build up complexity gradually
- Show uncertainty and revisions
- Link to previous insights
- Plan command sequences
- Execute tools in sequence
</reasoning>

<validation>
[Critical examination of conclusions]
- Question each conclusion
- Look for potential flaws
- Consider edge cases
- Validate assumptions
- Verify command choices
- Confirm all necessary tools were executed
</validation>

<synthesis>
[Bringing it all together]
- Summarize key insights
- Highlight remaining uncertainties
- Suggest next steps
- Note areas for future exploration
- Document command patterns
- Review tool execution results
</synthesis>

<conclusion>
[Final thoughts and recommendations]
- Clear, actionable conclusions
- Confidence levels
- Alternative approaches
- Open questions
- Command execution plan
- Verify all required tools were used
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
${Array.from(commands as Map<string, CommandInfo>)
  .map(([name, cmd]) => `- ${cmd.command}: ${cmd.description}
  Aliases: ${Array.from(cmd.aliases).join(', ') || 'none'}`)
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

interface CommandInfo {
  id: string;
  name: string;
  command: string;
  category: string;
  description: string;
  aliases: string[];
  parameters: Record<string, {
    type: string;
    description: string;
  }>;
  examples: string[];
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export class ChainOfThought {
  private toolExecutions: Map<string, { success: boolean; result: unknown }>;
  private commands: Map<string, CommandInfo>;
  private thoughts: ThoughtStep[];
  private chainId?: string;
  private context?: ChainOfThoughtContext;

  constructor() {
    this.toolExecutions = new Map<string, { success: boolean; result: unknown }>();
    this.commands = new Map<string, CommandInfo>();
    this.thoughts = [];
  }

  setContext(context: ChainOfThoughtContext): void {
    this.context = context;
  }

  recordToolExecution(toolName: string, result: unknown, success: boolean): void {
    this.toolExecutions.set(toolName, { success, result });
  }

  hasToolBeenExecuted(toolName: string): boolean {
    return this.toolExecutions.has(toolName);
  }

  getToolExecutionResult(toolName: string): unknown | null {
    return this.toolExecutions.get(toolName)?.result || null;
  }

  addThought(thought: Omit<ThoughtStep, 'id' | 'timestamp'>): void {
    const fullThought: ThoughtStep = {
      ...thought,
      id: Math.random().toString(36).substring(2),
      timestamp: Date.now()
    };
    this.thoughts.push(fullThought);
  }

  getThoughts(): ThoughtStep[] {
    return [...this.thoughts];
  }

  clearThoughts(): void {
    this.thoughts = [];
  }

  clearToolExecutions(): void {
    this.toolExecutions.clear();
  }

  clear(): void {
    this.clearThoughts();
    this.clearToolExecutions();
    this.commands.clear();
  }

  addCommand(name: string, info: CommandInfo): void {
    this.commands.set(name, info);
  }

  getCommands(): Map<string, CommandInfo> {
    return new Map(this.commands);
  }

  async startChain(task: string): Promise<string> {
    this.chainId = Math.random().toString(36).substring(2);
    this.clear();
    this.addThought({
      type: 'observation',
      content: `Starting chain for task: ${task}`,
      metadata: { task, chainId: this.chainId }
    });
    return this.chainId;
  }

  async conclude(conclusion: string, confidence: number): Promise<void> {
    this.addThought({
      type: 'decision',
      content: conclusion,
      metadata: { confidence, chainId: this.chainId }
    });
  }

  static getPrompt(context: ChainOfThoughtContext): string {
    return `${BASE_CHAIN_OF_THOUGHT_PROMPT}
${getCommandCategoriesSection()}

CONTEXT:
Session ID: ${context.sessionId}
User ID: ${context.userId}
Chain ID: ${context.chainId || 'Not started'}
${context.metadata ? `Metadata: ${JSON.stringify(context.metadata, null, 2)}` : ''}`;
  }

  static create(): ChainOfThought {
    return new ChainOfThought();
  }

  static createFromContext(): ChainOfThought {
    return new ChainOfThought();
  }
}

// Helper function to extract potential commands from text
async function extractCommands(text: string): Promise<string[]> {
  // Enhanced regex to catch more natural language patterns
  const commandRegex = /\b\w+(?:\s+(?:usage|info|status|check|running|hot|\w+))*\b/g;
  const matches = text.match(commandRegex) || [];
  
  try {
    const learnedCommands = await commandManager.getLearnedCommands();
    return matches.filter((match) => 
      commandManager.validateCommand(match, 'file') || 
      learnedCommands.some((cmd) => cmd.original === match.toLowerCase())
    );
  } catch (error) {
    // If memory isn't initialized, just use basic command validation
    return matches.filter((match) => commandManager.validateCommand(match, 'file'));
  }
}

// Export factory function
export const chainOfThought = (context: ChainOfThoughtContext) => {
  const instance = new ChainOfThought();
  instance.setContext(context);
  return instance;
}; 