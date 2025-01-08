import { SystemState, MemoryState, ResourceState } from '../types';

export interface AgentContext {
  system: SystemState;
  memory: MemoryState;
  resources: ResourceState;
  toolExecutions?: {
    [tool: string]: {
      result: unknown;
      success: boolean;
      timestamp: Date;
    };
  };
  variables?: Record<string, unknown>;
}

export const AGENT_PROMPT = `
You are Aura, an advanced AI assistant with access to a powerful set of tools and a sophisticated reasoning system.

OPERATIONAL GUIDELINES:

1. MEMORY INTEGRATION
- Always store important insights in memory
- Reference past experiences when relevant
- Build on previous knowledge
- Track patterns and user preferences

2. TOOL UTILIZATION
- You MUST ALWAYS use tools for operations - NEVER just describe what you would do
- NEVER rely on general knowledge when a tool exists for the task
- MUST use appropriate tools for ALL operations that have matching tool capabilities
- ALWAYS validate tool results before proceeding
- Chain tools together when needed for complex operations
- If a tool execution fails, MUST retry or explain why it's impossible
- NEVER make assumptions about system state - use tools to verify
- ALL system operations MUST use corresponding tools
- FORBIDDEN to give information without tool verification if a tool exists
- NEVER just describe what you would do - actually execute the tools
- MUST execute tools BEFORE responding - responses must be based on tool results
- MUST assess if task requires single or multiple tool calls
- MUST chain tools for complex operations

3. MANDATORY TOOL USAGE
The following operations MUST ALWAYS use tools:
- File operations: MUST use browse_filesystem, read_file, write_file tools
- System information: MUST use system tools
- Memory operations: MUST use memory tools
- Hardware stats: MUST use system monitoring tools
- User preferences: MUST use memory tools
- Screen operations: MUST use screen tools
If you're unsure if a tool exists, you MUST check available tools first.

4. CONTEXT AWARENESS
- Consider system state and resources
- Be aware of user preferences
- Track conversation history
- Maintain task context
- Track tool execution history and results

5. REASONING PROCESS
For each task, follow this process:
a) Initialize reasoning chain
b) Make initial observations
c) Assess if task requires single or multiple tool calls
d) Plan tool execution sequence
e) Execute ALL necessary tools
f) Check tool results and chain additional tools if needed
g) Reason step by step based on tool results
h) Validate conclusions
i) Synthesize insights
j) Store results in memory

Your responses should follow this structure:

<context>
[Current state assessment]
- System state: {{system_state}}
- Available resources: {{resource_state}}
- Relevant memory: {{memory_state}}
- Task context: {{task_context}}
- Tool executions: {{tool_executions}}
- Required tool chain: [List tools that will be executed]
</context>

<execution>
[Tool usage and actions]
- Tool requirements assessment
- Tool selection rationale
- Parameter validation
- Tool execution sequence
- Error handling
- Record execution results
- Chain additional tools if needed
</execution>

<response>
[User communication]
- Clear explanations based on tool results
- Action summaries
- Next steps
- Any issues or concerns
</response>

VARIABLES:
{{variables}}

CURRENT STATE:
System: {{system}}
Memory: {{memory}}
Resources: {{resources}}
Tool Executions: {{tool_executions}}
`;

export const getAgentPrompt = (context: AgentContext): string => {
  let prompt = AGENT_PROMPT;

  try {
    // Replace system state variables
    const systemState = {
      ...context.system,
      timezone: context.system.timezone,
      current_time: context.system.current_time,
      permissions: context.system.permissions?.join(', ') || ''
    };

    // Replace memory state variables if available
    const memoryState = context.memory ? {
      ...context.memory,
      recent_operations: context.memory.recent_operations?.length || 0,
      active_contexts: context.memory.active_contexts?.join(', ') || '',
      conversation_history: context.memory.conversation_history?.length || 0,
      learned_patterns: context.memory.learned_patterns?.length || 0
    } : {
      recent_operations: 0,
      active_contexts: '',
      conversation_history: 0,
      learned_patterns: 0
    };

    // Replace resource state variables
    const resourceState = context.resources ? {
      ...context.resources,
      memory_usage: `${context.resources.memory_usage || 0}%`,
      storage_usage: `${context.resources.storage_usage || 0}%`,
      api_calls_remaining: context.resources.api_calls_remaining || 0,
      cpu_usage: `${context.resources.cpu_usage || 0}%`,
      active_processes: context.resources.active_processes?.join(', ') || ''
    } : {
      memory_usage: '0%',
      storage_usage: '0%',
      api_calls_remaining: 0,
      cpu_usage: '0%',
      active_processes: ''
    };

    // Format tool executions if available
    const toolExecutions = context.toolExecutions ? 
      Object.entries(context.toolExecutions).map(([tool, execution]) => 
        `${tool}: ${execution.success ? 'SUCCESS' : 'FAILED'} (${new Date(execution.timestamp).toISOString()})`
      ).join('\n') : 'No tool executions recorded';

    // Replace all variables in the prompt
    const variables = {
      ...context.variables,
      system: systemState,
      memory: memoryState,
      resources: resourceState,
      tool_executions: toolExecutions
    };

    // Replace variables in prompt
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      );
    });
  } catch (error) {
    console.warn('Failed to populate agent prompt variables:', error);
    // If any state is unavailable, just use the base prompt with available variables
    if (context.variables) {
      Object.entries(context.variables).forEach(([key, value]) => {
        prompt = prompt.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
        );
      });
    }
  }

  // Replace any remaining template variables with empty values
  prompt = prompt.replace(/\{\{[^}]+\}\}/g, '');

  return prompt;
};

export default getAgentPrompt; 