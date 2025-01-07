import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { promptManager } from '@/app/utils/promptUtils';
import { toolRegistry } from '@/app/utils/agent/tools/registry';
import { executeTool } from '@/app/utils/toolUtils';
import { ValidationError } from '@/app/common/errors';
import { Tool, ToolParameterDefinition } from '@/app/utils/agent/tools/types';
import { initializeStorage } from '@/app/utils/db/init';
import { commandManager } from '@/app/utils/agent/commandUtils';
import { memoryManager } from '@/app/utils/memoryUtils';

if (!process.env.OPENAI_MODEL || process.env.OPENAI_MODEL !== 'gpt-4o-mini') {
  throw new Error('OPENAI_MODEL must be set to gpt-4o-mini');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function formatToolForJSON(tool: Tool) {
  if (!tool.metadata || !tool.metadata.parameters) {
    console.error(`Tool ${tool.name} is missing metadata or parameters`);
    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  const properties = Object.entries(tool.metadata.parameters).reduce<Record<string, unknown>>((acc, [key, param]) => {
    const paramDef = param as ToolParameterDefinition;
    const property: Record<string, unknown> = {
      type: paramDef.type.toLowerCase(),
      description: paramDef.description
    };

    if (paramDef.enum) {
      property.enum = paramDef.enum;
    }

    if (paramDef.schema) {
      property.items = {
        type: 'object',
        properties: paramDef.schema.reduce<Record<string, unknown>>((props, item) => ({
          ...props,
          [item.name]: {
            type: item.type.toLowerCase(),
            description: item.description
          }
        }), {})
      };
    }

    return {
      ...acc,
      [key]: property
    };
  }, {});

  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties,
      required: tool.metadata.required || []
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context_id } = await req.json();

    // Initialize storage and managers
    await initializeStorage();
    await commandManager.initialize(memoryManager);
    await promptManager.initialize();

    // Get system prompt with available tools
    const systemPrompt = promptManager.getSystemPrompt();

    // Prepare messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Get available tools for OpenAI
    const tools = toolRegistry.list().map(tool => ({
      type: 'function' as const,
      function: formatToolForJSON(tool)
    }));

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      tools,
      tool_choice: 'auto'
    });

    // Process tool calls if any
    const choice = response.choices[0];
    if (!choice || !choice.message) {
      return Response.json({
        role: 'assistant',
        content: 'I apologize, but I received an invalid response. Please try again.'
      });
    }

    if (choice.message.tool_calls) {
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async toolCall => {
          const { name, arguments: args } = toolCall.function;
          try {
            const result = await executeTool(name, JSON.parse(args));
            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              name,
              content: JSON.stringify(result)
            };
          } catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            throw error instanceof Error ? error : new Error('Unknown error');
          }
        })
      );

      // Add tool results to messages
      apiMessages.push(choice.message);
      apiMessages.push(...toolResults);

      // Get final response from OpenAI
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: apiMessages
      });

      const finalChoice = finalResponse.choices[0];
      if (!finalChoice || !finalChoice.message) {
        return Response.json({
          role: 'assistant',
          content: 'I apologize, but I received an invalid response after processing tools. Please try again.'
        });
      }

      return Response.json({
        role: finalChoice.message.role,
        content: finalChoice.message.content || 'I apologize, but I received an empty response.'
      });
    }

    return Response.json({
      role: choice.message.role,
      content: choice.message.content || 'I apologize, but I received an empty response.'
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return Response.json({
      role: 'assistant',
      content: error instanceof Error 
        ? `I apologize, but an error occurred: ${error.message}`
        : 'I apologize, but an unknown error occurred.'
    }, {
      status: error instanceof ValidationError ? 400 : 500
    });
  }
}