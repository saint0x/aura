import { readFileSync } from 'fs';
import { join } from 'path';
import { ThoughtStep } from '../types';

// Function to extract a prompt section from PROMPTS.md
function extractPrompt(content: string, sectionName: string): string {
  const sectionRegex = new RegExp(`## ${sectionName}[\\s\\S]*?\`\`\`typescript([\\s\\S]*?)\`\`\``, 'i');
  const match = content.match(sectionRegex);
  if (!match) {
    console.warn(`Section ${sectionName} not found in PROMPTS.md`);
    return '';
  }
  return match[1].trim();
}

// Load prompts from PROMPTS.md at build time
let promptsContent = '';
try {
  promptsContent = readFileSync(join(process.cwd(), 'PROMPTS.md'), 'utf-8');
} catch (error) {
  console.warn('Failed to load PROMPTS.md:', error);
}

// Export static prompts
export const PROMPTS = {
  THINKING_FRAMEWORK: extractPrompt(promptsContent, 'Thinking Framework Variable'),
  TOOL_FRAMEWORK: extractPrompt(promptsContent, 'Tool Framework'),
  TOOL_USE: extractPrompt(promptsContent, 'Tool Use Framework'),
  VISION_ANALYSIS: extractPrompt(promptsContent, 'Vision Analysis Prompt'),
  SYSTEM_PROMPT: extractPrompt(promptsContent, 'Core System Prompt')
};

// Export dynamic prompt generators
export { getAgentPrompt, AGENT_PROMPT, type AgentContext } from './agent';
export { 
  chainOfThought, 
  ChainOfThought, 
  type ChainOfThoughtContext,
  BASE_CHAIN_OF_THOUGHT_PROMPT 
} from './chain-of-thought';

// Re-export types
export type { ThoughtStep }; 