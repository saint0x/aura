import { Tool, ToolContext, ToolResult, NextAction, ThoughtStep, ReasoningStep } from '../types';
import { ChainOfThought } from '../prompts/chain-of-thought';
import { ReasoningEngine, createReasoningEngine } from '../reasoningUtils';
import { generateId } from '../../../utils/idUtils';

interface ChainContext {
  chainId: string;
  previousResults: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  messages: string[];
  reasoningSteps: ReasoningStep[];
  pendingActions: Array<NextAction>;
}

function logToolResult(result: ToolResult): void {
  console.log('Tool execution result:', result);
}

function logToolExecutionTime(tool: string, duration: number): void {
  console.log(`Tool ${tool} executed in ${duration}ms`);
}

function logToolChainResults(results: ToolResult[]): void {
  console.log('Tool chain results:', results);
}

function logReasoningState(state: unknown): void {
  console.log('Reasoning state:', state);
}

function convertToThoughtStep(step: ReasoningStep): ThoughtStep {
  return {
    id: step.id || generateId(),
    type: step.type === 'thought' ? 'analysis' : 
          step.type === 'action' ? 'plan' :
          step.type === 'result' ? 'observation' : 'decision',
    content: step.content,
    timestamp: step.timestamp || Date.now(),
    metadata: step.metadata
  };
}

function convertPermissionsToRecord(permissions: string[]): Record<string, boolean> {
  return permissions.reduce((acc, perm) => {
    acc[perm] = true;
    return acc;
  }, {} as Record<string, boolean>);
}

export class ToolHandler {
  private tools: Map<string, Tool>;
  private chainOfThought: ChainOfThought;
  private activeChains: Map<string, ChainContext>;
  private reasoningEngine: ReasoningEngine;

  constructor() {
    this.tools = new Map();
    this.chainOfThought = new ChainOfThought();
    this.activeChains = new Map();
    this.reasoningEngine = createReasoningEngine({
      sessionId: generateId(),
      userId: generateId(),
      metadata: {
        agent_type: 'tool_handler',
        capabilities: []
      }
    });
  }

  async executeTool(
    toolName: string,
    toolArgs: Record<string, unknown>,
    context: ToolContext,
    chainId: string,
    permissions: string[],
    reasoningSteps: ReasoningStep[] = []
  ): Promise<ToolResult> {
    try {
      const toolContext: ToolContext = {
        contextId: context.contextId,
        chainId,
        sessionId: context.sessionId,
        permissions: convertPermissionsToRecord(permissions),
        metadata: context.metadata
      };

      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      tool.setContext(toolContext);
      const toolResult = await tool.execute(toolArgs);
      
      const nextAction: NextAction = {
        tool: toolName,
        args: toolArgs,
        message: toolArgs.message as string
      };

      return {
        success: true,
        result: toolResult,
        nextAction,
        chainId,
        completed: true,
        reasoningSteps: reasoningSteps.map(convertToThoughtStep),
        metadata: context.metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        chainId,
        completed: false,
        metadata: context.metadata
      };
    }
  }
} 