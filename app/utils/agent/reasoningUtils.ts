import { chainOfThought, ChainOfThought, ChainOfThoughtContext, ThoughtStep } from './prompts/chain-of-thought';
import { memoryManager } from '../memoryUtils';
import { ReasoningStep, MemoryType } from './types';

export interface ReasoningContext extends ChainOfThoughtContext {
  taskId?: string;
  parentChainId?: string;
  variables?: Record<string, unknown>;
}

export class ReasoningEngine {
  private context: ReasoningContext;
  private activeChainId: string | null = null;

  constructor(context: ReasoningContext) {
    this.context = context;
  }

  async startReasoning(task: string): Promise<void> {
    const cot = chainOfThought({
      sessionId: this.context.sessionId,
      userId: this.context.userId,
      metadata: {
        task_id: this.context.taskId,
        parent_chain_id: this.context.parentChainId,
        ...this.context.metadata
      }
    });

    this.activeChainId = await cot.startChain(task);

    // Store initial context
    await memoryManager.store(
      this.context.sessionId,
      'Reasoning context initialized',
      'context' as MemoryType,
      {
        chain_id: this.activeChainId,
        task,
        variables: this.context.variables,
        ...this.context.metadata
      }
    );
  }

  async addThought(step: ThoughtStep): Promise<void> {
    if (!this.activeChainId) {
      throw new Error('Reasoning chain not initialized. Call startReasoning first.');
    }

    const cot = chainOfThought({
      sessionId: this.context.sessionId,
      userId: this.context.userId,
      chainId: this.activeChainId,
      metadata: this.context.metadata
    });

    await cot.addThought(step);
  }

  async conclude(conclusion: string, confidence: number): Promise<void> {
    if (!this.activeChainId) {
      throw new Error('Reasoning chain not initialized. Call startReasoning first.');
    }

    const cot = chainOfThought({
      sessionId: this.context.sessionId,
      userId: this.context.userId,
      chainId: this.activeChainId,
      metadata: this.context.metadata
    });

    await cot.conclude(conclusion, confidence);
  }

  async getReasoningChain(): Promise<{
    steps: ReasoningStep[];
    conclusion: string | null;
    context: Record<string, unknown>;
  }> {
    if (!this.activeChainId) {
      throw new Error('Reasoning chain not initialized. Call startReasoning first.');
    }

    const cot = chainOfThought({
      sessionId: this.context.sessionId,
      userId: this.context.userId,
      chainId: this.activeChainId,
      metadata: this.context.metadata
    });

    const [steps, conclusion, contextEntries] = await Promise.all([
      cot.getChainSteps(),
      cot.getConclusion(),
      memoryManager.searchMemory(this.context.sessionId, '', {
        metadata: { chain_id: this.activeChainId },
        type: 'context'
      })
    ]);

    return {
      steps,
      conclusion,
      context: contextEntries[0]?.metadata || {}
    };
  }

  async findSimilarReasoning(query: string): Promise<{
    chainId: string;
    similarity: number;
    conclusion: string | null;
  }[]> {
    // Search for similar reasoning chains in memory
    const entries = await memoryManager.searchMemory(
      this.context.sessionId,
      query,
      {
        type: 'conclusion'
      }
    );

    // Get full chains for each match
    const chains = await Promise.all(
      entries.map(async (entry) => {
        const chainId = entry.metadata?.chain_id as string;
        if (!chainId) return null;

        const cot = chainOfThought({
          sessionId: this.context.sessionId,
          userId: this.context.userId,
          chainId,
          metadata: this.context.metadata
        });

        const conclusion = await cot.getConclusion();

        return {
          chainId,
          similarity: entry.metadata?.similarity as number || 0,
          conclusion
        };
      })
    );

    return chains.filter((chain): chain is NonNullable<typeof chain> => chain !== null);
  }

  async getPromptWithContext(): Promise<string> {
    return await ChainOfThought.getPrompt({
      ...this.context.variables,
      sessionId: this.context.sessionId,
      userId: this.context.userId,
      taskId: this.context.taskId,
      chainId: this.activeChainId
    });
  }
}

// Export factory function
export const createReasoningEngine = (context: ReasoningContext) => new ReasoningEngine(context); 