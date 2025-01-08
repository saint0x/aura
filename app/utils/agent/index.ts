import { OpenAI } from 'openai';
import { Message } from '@/app/types';
import { Tool as ToolType, ToolResult } from './tools/types';
import { toolRegistry } from './tools/registry';
import { chainOfThought, ChainOfThought, ChainOfThoughtContext } from './prompts/chain-of-thought';
import { getAgentPrompt, AgentContext as PromptAgentContext } from './prompts/agent';
import { createReasoningEngine, ReasoningEngine } from './reasoningUtils';
import { memoryManager } from '../memoryUtils';
import { commandManager, FILE_CONCEPTS, SYSTEM_CONCEPTS, MEMORY_CONCEPTS, REASONING_CONCEPTS, SCREEN_CONCEPTS, VOICE_CONCEPTS, COMMAND_CATEGORIES } from './commandUtils';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ReasoningStep, ReasoningChain, AgentContext, AgentMessage, AgentResponse, SystemState, ResourceState } from './types';
import { promptManager } from '../promptUtils';

export class Agent {
  private openai: OpenAI;
  private sessionId: string;
  private userId: string;
  private reasoningEngine: ReasoningEngine;

  constructor(openai: OpenAI, sessionId: string, userId: string) {
    this.openai = openai;
    this.sessionId = sessionId;
    this.userId = userId;
    this.reasoningEngine = createReasoningEngine({
      sessionId,
      userId,
      metadata: {
        agent_type: 'aura',
        capabilities: toolRegistry.list().map(t => t.name)
      }
    });
  }

  private async ensureToolsRegistered(): Promise<void> {
    const tools = toolRegistry.list();
    if (tools.length === 0) {
      await promptManager.initialize();
    }
  }

  private formatToolForJSON(tool: ToolType): Record<string, unknown> {
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.metadata.parameters,
      required: tool.metadata.required
    };
  }

  private convertToOpenAIMessage(message: Message): ChatCompletionMessageParam {
    return {
      role: message.role,
      content: message.content || '',
      name: message.id // Use message ID as name if needed
    };
  }

  private async planToolExecution(task: string, tools: any[]): Promise<{
    tools: Array<{
      tool: string;
      args: Record<string, unknown>;
      purpose: string;
      requires_verification: boolean;
      next_phase: string | null;
    }>;
    reasoning: {
      observation: string;
      verification_needed: boolean;
      next_phase: string | null;
    };
  }> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `TASK PLANNING ASSISTANT (JSON)
====================

CRITICAL: You MUST plan tool executions for ALL operations. NEVER return plain text instructions.

YOUR TASK:
- Plan required tool executions
- Chain tools for complex operations
- Ensure verification at each step

AVAILABLE TOOLS:
{{tools}}

TOOL CATEGORIES:
{{tool_categories}}

COMMAND CATEGORIES:
{{command_categories}}

COMMAND CONCEPTS:
{{command_concepts}}

MANDATORY REQUIREMENTS:
1. You MUST include at least one tool execution in your plan
2. You MUST use appropriate tools based on their categories and capabilities
3. You MUST chain tools for complex operations
4. You MUST verify each tool result
5. NEVER return instructions without tool execution
6. ALL operations MUST use appropriate tools from the registry
7. You MUST use command categories and concepts to understand operations

RESPONSE FORMAT:
{
  "tools": [{
    "tool": "tool_name",
    "args": {"param1": "value1"},
    "purpose": "DETAILED explanation of why this tool is needed",
    "requires_verification": true,
    "next_phase": "verification/execution/completion"
  }],
  "reasoning": {
    "observation": "Analysis of required tools and steps",
    "verification_needed": true,
    "next_phase": "verification/execution/completion"
  }
}`
          .replace('{{tools}}', JSON.stringify(tools, null, 2))
          .replace('{{tool_categories}}', JSON.stringify(Array.from(new Set(tools.map(t => t.category))), null, 2))
          .replace('{{command_categories}}', JSON.stringify(Object.keys(COMMAND_CATEGORIES), null, 2))
          .replace('{{command_concepts}}', JSON.stringify({
            file: FILE_CONCEPTS,
            system: SYSTEM_CONCEPTS,
            memory: MEMORY_CONCEPTS,
            reasoning: REASONING_CONCEPTS,
            screen: SCREEN_CONCEPTS,
            voice: VOICE_CONCEPTS
          }, null, 2))
        },
        { role: 'user', content: task }
      ],
      response_format: { type: 'json_object' }
    });

    const planChoice = response.choices[0];
    if (!planChoice?.message?.content) {
      throw new Error('Invalid planning response from OpenAI');
    }

    const plan = JSON.parse(planChoice.message.content);
    
    // Validate that the plan includes tool executions
    if (!plan.tools || plan.tools.length === 0) {
      throw new Error('Plan must include at least one tool execution');
    }

    // Validate tool availability and parameters
    for (const toolPlan of plan.tools) {
      const tool = toolRegistry.get(toolPlan.tool);
      if (!tool) {
        throw new Error(`Tool ${toolPlan.tool} not found in registry`);
      }
      
      const isValid = await toolRegistry.validate(toolPlan.tool, toolPlan.args);
      if (!isValid) {
        throw new Error(`Invalid parameters for tool ${toolPlan.tool}`);
      }
    }

    return plan;
  }

  private async verifyToolResult(
    tool: string, 
    result: unknown, 
    purpose: string
  ): Promise<{
    success: boolean;
    next_action: string | null;
    observation: string;
    requires_retry: boolean;
  }> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `TOOL RESULT VERIFICATION (JSON)
======================

CRITICAL: You MUST verify the tool execution result and determine next actions.

YOUR TASK:
- Verify tool execution success
- Validate result matches purpose
- Plan next actions if needed

AVAILABLE TOOLS:
{{tools}}

TOOL CAPABILITIES:
{{tool_capabilities}}

MANDATORY REQUIREMENTS:
1. You MUST check if result satisfies purpose
2. You MUST verify operation completed
3. You MUST determine if retry needed
4. You MUST specify next action if incomplete
5. You MUST validate against expected outcome
6. You MUST suggest appropriate tools from registry for next actions
7. NEVER skip verification steps

RESPONSE FORMAT:
{
  "success": true/false,
  "next_action": "retry/continue/complete/null",
  "observation": "DETAILED analysis of the result",
  "requires_retry": true/false
}`
          .replace('{{tools}}', JSON.stringify(toolRegistry.list().map(t => this.formatToolForJSON(t)), null, 2))
          .replace('{{tool_capabilities}}', JSON.stringify(Object.fromEntries(
            toolRegistry.list().map(t => [t.category, t.description])
          ), null, 2))
        },
        {
          role: 'user',
          content: JSON.stringify({
            tool,
            result,
            purpose,
            timestamp: new Date().toISOString()
          })
        }
      ],
      response_format: { type: 'json_object' }
    });

    const verifyChoice = response.choices[0];
    if (!verifyChoice?.message?.content) {
      throw new Error('Invalid verification response from OpenAI');
    }

    return JSON.parse(verifyChoice.message.content);
  }

  async processMessage(messages: Message[]): Promise<Message> {
    try {
      // Ensure tools are registered
      await this.ensureToolsRegistered();

      // Initialize memory and command managers
      await memoryManager.addEntry({
        context_id: this.sessionId,
        type: 'context',
        content: 'Initializing agent session',
        metadata: {
          agent_type: 'aura',
          capabilities: toolRegistry.list().map(t => t.name)
        }
      });
      await commandManager.initialize(memoryManager);

      // Start reasoning chain
      const task = messages[messages.length - 1].content;
      await this.reasoningEngine.startReasoning(task);

      // Initialize chain of thought context
      const cotContext: ChainOfThoughtContext = {
        sessionId: this.sessionId,
        userId: this.userId,
        metadata: {
          agent_type: 'aura',
          capabilities: toolRegistry.list().map(t => t.name),
          available_commands: commandManager.getAvailableCommands('file'),
          command_categories: Object.keys(COMMAND_CATEGORIES)
        }
      };

      // Create chain of thought instance
      const cot = chainOfThought(cotContext);
      
      // Generate chainId
      const chainId = await cot.startChain(task);

      // Update context with chainId
      cotContext.chainId = chainId;

      // Initialize variables
      const toolExecutionMap = new Map<string, {
        executed: boolean;
        result?: unknown;
        error?: string;
      }>();

      // Create system state
      const memUsage = process.memoryUsage();
      const systemState: SystemState = {
        status: 'running',
        memory_usage: {
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers,
          rss: memUsage.rss
        },
        uptime: process.uptime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        current_time: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: this.userId,
        permissions: []
      };

      // Create resource state with string percentages
      const resourceState: ResourceState = {
        cpu_usage: 0,
        memory_available: memUsage.heapTotal - memUsage.heapUsed,
        disk_space: 0,
        network_status: 'connected',
        memory_usage: '0%',
        storage_usage: '0%',
        api_calls_remaining: 100,
        active_processes: []
      };

      // Execute and verify tools
      const toolResults = await Promise.all([
        getAgentPrompt({
          system: systemState,
          memory: await memoryManager.getMemoryState(this.sessionId),
          resources: resourceState,
          toolExecutions: Object.fromEntries(
            Array.from(toolExecutionMap.entries()).map(([name, details]) => [
              name,
              {
                result: details.result,
                success: !details.error,
                timestamp: new Date()
              }
            ])
          ),
          variables: {
            tools: toolRegistry.list().map(t => this.formatToolForJSON(t)),
            commands: await commandManager.getLearnedCommands(),
            memory: await memoryManager.getRecentEntries(this.sessionId)
          }
        })
      ]);

      // Start chain and get prompts
      const [basePrompt, agentPrompt] = await Promise.all([
        ChainOfThought.getPrompt({
          sessionId: this.sessionId,
          userId: this.userId,
          chainId,
          metadata: {
            agent_type: 'aura',
            capabilities: toolRegistry.list().map(t => t.name),
            available_commands: commandManager.getAvailableCommands('file'),
            command_categories: Object.keys(COMMAND_CATEGORIES)
          }
        }),
        getAgentPrompt({
          system: systemState,
          memory: await memoryManager.getMemoryState(this.sessionId),
          resources: {
            ...resourceState,
            memory_usage: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
            storage_usage: '0%'
          },
          toolExecutions: Object.fromEntries(
            Array.from(toolExecutionMap.entries()).map(([name, details]) => [
              name,
              {
                result: details.result,
                success: !details.error,
                timestamp: new Date()
              }
            ])
          ),
          variables: {
            tools: toolRegistry.list().map(t => this.formatToolForJSON(t)),
            commands: await commandManager.getLearnedCommands(),
            memory: await memoryManager.getRecentEntries(this.sessionId)
          }
        })
      ]);

      // Store initial context in memory
      await memoryManager.store(
        this.sessionId,
        'Starting new interaction',
        'context',
        {
          chain_id: chainId,
          task,
          base_prompt: basePrompt,
          agent_prompt: agentPrompt,
          available_tools: toolRegistry.list().map(t => t.name),
          available_commands: commandManager.getAvailableCommands('file')
        }
      );

      // Get available tools
      const tools = toolRegistry.list().map(tool => this.formatToolForJSON(tool));

      // First phase: Plan tool execution
      const plan = await this.planToolExecution(task, tools);

      // Add initial reasoning to chain
      await this.reasoningEngine.addThoughtStep({
        type: 'observation',
        content: plan.reasoning.observation,
        description: 'Initial observation',
        metadata: {
          verification_needed: plan.reasoning.verification_needed,
          next_phase: plan.reasoning.next_phase
        }
      });

      // Add initial thought to chain of thought
      await cot.addThought({
        type: 'observation',
        content: plan.reasoning.observation,
        metadata: {
          verification_needed: plan.reasoning.verification_needed,
          next_phase: plan.reasoning.next_phase
        }
      });

      // Generate final response
      const finalResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `RESPONSE GENERATION (JSON)
==================

CRITICAL: You MUST base your response on actual tool execution results. NEVER give plain text instructions.

YOUR TASK:
- Report tool execution results
- Explain what was actually done
- Detail any errors or issues

AVAILABLE TOOLS:
{{tools}}

TOOL EXECUTION HISTORY:
{{tool_executions}}

MANDATORY REQUIREMENTS:
1. You MUST only describe actions that were actually executed
2. You MUST include tool execution results
3. You MUST report errors if tools failed
4. NEVER give hypothetical instructions
5. NEVER suggest manual steps
6. ALL responses MUST be based on tool results
7. You MUST reference specific tool executions and their results

RESPONSE FORMAT:
{
  "response": "Detailed description of what was actually done based on tool results",
  "next_steps": "Next steps based on actual tool execution state",
  "error_context": "Details of any errors that occurred during tool execution"
}`
            .replace('{{tools}}', JSON.stringify(toolRegistry.list().map(t => this.formatToolForJSON(t)), null, 2))
            .replace('{{tool_executions}}', JSON.stringify(Array.from(toolExecutionMap.entries())
              .map(([name, details]) => ({
                tool: name,
                executed: details.executed,
                result: details.result,
                error: details.error
              })), null, 2))
          },
          ...messages.map(msg => this.convertToOpenAIMessage(msg))
        ],
        response_format: { type: 'json_object' }
      });

      const finalChoice = finalResponse.choices[0];
      if (!finalChoice?.message?.content) {
        throw new Error('Invalid final response from OpenAI');
      }

      const response = JSON.parse(finalChoice.message.content);

      // Store final response in memory
      await memoryManager.store(
        this.sessionId,
        response.response,
        'response',
        {
          chain_id: chainId,
          next_steps: response.next_steps,
          error_context: response.error_context,
          tool_executions: Array.from(toolExecutionMap.entries()).map(([name, details]) => ({
            tool: name,
            executed: details.executed,
            result: details.result,
            error: details.error
          }))
        }
      );

      // Add conclusion to chain of thought
      await cot.conclude(response.response, 1.0);

      // Get reasoning chain for metadata
      const reasoningChain = await this.reasoningEngine.getReasoningChain();
      const chain: ReasoningChain = {
        id: this.sessionId,
        context_id: this.sessionId,
        steps: reasoningChain.steps.map(step => ({
          stepNumber: step.stepNumber,
          type: step.type === 'error' ? 'observation' : step.type,
          content: step.content,
          description: step.description,
          explanation: step.explanation,
          observation: step.observation,
          metadata: step.metadata || {}
        }))
      };

      // Create agent context for prompt
      const promptContext: PromptAgentContext = {
        system: systemState,
        memory: await memoryManager.getMemoryState(this.sessionId),
        resources: resourceState,
        toolExecutions: Object.fromEntries(
          Array.from(toolExecutionMap.entries()).map(([name, details]) => [
            name,
            {
              result: details.result,
              success: !details.error,
              timestamp: new Date()
            }
          ])
        ),
        variables: {
          tools: toolRegistry.list().map(t => this.formatToolForJSON(t)),
          commands: await commandManager.getLearnedCommands(),
          memory: await memoryManager.getRecentEntries(this.sessionId)
        }
      };

      // Get agent prompt
      const prompt = getAgentPrompt(promptContext);

      return {
        role: 'assistant',
        content: response.response,
        metadata: {
          reasoning_chain: chain,
          tool_execution_map: Object.fromEntries(toolExecutionMap),
          next_steps: response.next_steps,
          error_context: response.error_context
        }
      };
    } catch (error) {
      console.error('Error in agent:', error);
      
      await this.reasoningEngine.addThoughtStep({
        type: 'observation',
        content: `Error in agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        description: 'Error occurred during processing',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          error_type: 'error'
        }
      });

      throw error;
    }
  }
}

// Export factory function
export const createAgent = (openai: OpenAI, sessionId: string, userId: string) => new Agent(openai, sessionId, userId); 