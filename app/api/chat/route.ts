import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { createAgent } from '@/app/utils/agent';
import { initializeStorage, getMemoryStorage } from '@/app/utils/db/init';
import { commandManager } from '@/app/utils/agent/commandUtils';
import { memoryManager } from '@/app/utils/memoryUtils';
import { promptManager } from '@/app/utils/promptUtils';
import { ValidationError } from '@/app/common/errors';

if (!process.env.OPENAI_MODEL || process.env.OPENAI_MODEL !== 'gpt-4o-mini') {
  throw new Error('OPENAI_MODEL must be set to gpt-4o-mini');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { messages, context_id } = await req.json();

    // Initialize storage and managers
    await initializeStorage();
    await commandManager.initialize(memoryManager);

    // Initialize memory storage
    const memoryStorage = getMemoryStorage();
    await memoryStorage.initialize();

    // Initialize prompt manager to register tools
    await promptManager.initialize();

    // Create agent instance
    const agent = createAgent(openai, context_id || crypto.randomUUID(), 'user');

    // Process message through agent
    const response = await agent.processMessage(messages);

    return Response.json(response);
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