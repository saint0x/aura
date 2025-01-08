import { ReasoningStep, ThoughtStep, ToolResult } from '../types';

function formatStep(step: ReasoningStep): string {
  const timestamp = step.timestamp ? new Date(step.timestamp).toISOString() : new Date().toISOString();
  const metadata = step.metadata ? ` (${JSON.stringify(step.metadata)})` : '';
  
  let content = step.content;
  if (step.type === 'observation' && step.observation) {
    content = `Observed: ${step.observation}`;
  } else if (step.type === 'decision' && step.decision) {
    content = `Decided: ${step.decision}`;
  }

  return `[${timestamp}] ${step.type.toUpperCase()}: ${content}${metadata}`;
}

export function logReasoningSteps(steps: ReasoningStep[]): void {
  console.log('\nReasoning Steps:');
  console.log('---------------');
  steps.forEach((step, index) => {
    console.log(`${index + 1}. ${formatStep(step)}`);
  });
}

export function logToolResult(result: ToolResult): void {
  console.log('\nTool Execution Result:');
  console.log('---------------------');
  console.log(`Success: ${result.success}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  if (result.result) {
    console.log('Result:', result.result);
  }

  if (result.reasoningSteps?.length) {
    logReasoningSteps(result.reasoningSteps.map(thoughtToReasoning));
  }

  if (result.nextAction) {
    console.log('\nNext Action:');
    console.log(`Tool: ${result.nextAction.tool}`);
    console.log('Arguments:', result.nextAction.args);
    if (result.nextAction.message) {
      console.log(`Message: ${result.nextAction.message}`);
    }
  }
}

function thoughtToReasoning(thought: ThoughtStep): ReasoningStep {
  let type: 'observation' | 'thought' | 'action' | 'result' | 'decision';
  switch (thought.type) {
    case 'analysis':
      type = 'thought';
      break;
    case 'plan':
      type = 'action';
      break;
    case 'observation':
      type = 'observation';
      break;
    case 'decision':
      type = 'decision';
      break;
    default:
      type = 'thought';
  }

  return {
    stepNumber: 0, // Default step number since ThoughtStep doesn't have it
    type,
    content: thought.content,
    description: thought.content, // Use content as description
    timestamp: thought.timestamp,
    metadata: thought.metadata,
    observation: type === 'observation' ? thought.content : undefined,
    decision: type === 'decision' ? thought.content : undefined
  };
}

export function logToolChain(results: ToolResult[]): void {
  console.log('\nTool Chain Results:');
  console.log('------------------');
  results.forEach((result, index) => {
    console.log(`\nStep ${index + 1}:`);
    logToolResult(result);
  });
} 