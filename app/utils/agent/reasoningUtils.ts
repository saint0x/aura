import { ThoughtStep } from './types';

export interface ReasoningStep {
  stepNumber: number;
  type: 'observation' | 'thought' | 'action' | 'result' | 'error';
  content: string;
  description: string;
  explanation?: string;
  observation?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
  id?: string;
}

export interface ReasoningEngine {
  addStep(step: Partial<ReasoningStep>): void;
  getSteps(): ReasoningStep[];
  getCurrentStep(): ReasoningStep | null;
  getLastStep(): ReasoningStep | null;
  clear(): void;
  toThoughtSteps(): ThoughtStep[];
  startReasoning(task: string): Promise<void>;
  addThoughtStep(step: Partial<ReasoningStep>): Promise<void>;
  getReasoningChain(): Promise<{ steps: ReasoningStep[]; conclusion?: string }>;
}

export function createReasoningEngine(context: { 
  sessionId: string; 
  userId: string; 
  metadata: Record<string, unknown>; 
}): ReasoningEngine {
  let steps: ReasoningStep[] = [];
  let currentStep: number = 0;
  let conclusion: string | undefined;

  return {
    addStep(step: Partial<ReasoningStep>) {
      const newStep: ReasoningStep = {
        stepNumber: steps.length + 1,
        type: step.type || 'observation',
        content: step.content || '',
        description: step.description || '',
        metadata: step.metadata,
        timestamp: step.timestamp || Date.now(),
        id: step.id || Math.random().toString(36).substring(2),
        explanation: step.explanation,
        observation: step.observation
      };
      steps.push(newStep);
      currentStep = steps.length;
    },

    getSteps() {
      return steps;
    },

    getCurrentStep() {
      return currentStep > 0 && currentStep <= steps.length ? steps[currentStep - 1] : null;
    },

    getLastStep() {
      return steps.length > 0 ? steps[steps.length - 1] : null;
    },

    clear() {
      steps = [];
      currentStep = 0;
      conclusion = undefined;
    },

    toThoughtSteps() {
      return steps.map(step => ({
        id: step.id || Math.random().toString(36).substring(2),
        type: step.type === 'thought' ? 'analysis' :
              step.type === 'action' ? 'plan' :
              step.type === 'result' ? 'observation' : 'decision',
        content: step.content,
        timestamp: step.timestamp || Date.now(),
        metadata: step.metadata
      }));
    },

    async startReasoning(task: string) {
      this.clear();
      this.addStep({
        type: 'observation',
        content: `Starting reasoning for task: ${task}`,
        description: 'Initial observation',
        metadata: { task, context }
      });
    },

    async addThoughtStep(step: Partial<ReasoningStep>) {
      this.addStep(step);
    },

    async getReasoningChain() {
      return {
        steps,
        conclusion
      };
    }
  };
} 