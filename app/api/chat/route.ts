import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getMemory, addToMemory, MemoryEntry } from '@/app/utils/memoryUtils';
import { executeTool } from '@/app/utils/toolUtils';
import { getToolGuidelinesString } from '@/app/utils/guidelinesUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Aura, a helpful AI assistant with access to various tools through function calls. Always use these tools when appropriate. Never claim you can't perform a task if a suitable tool is available.

You have the following tools at your disposal:

1. createFile(path: string, content: string): Create a new file with given content.
   - path: The path where the file should be created (e.g., 'path/to/file.txt')
   - content: The content to write to the file

2. readFile(path: string): Read the contents of a file.
   - path: The path of the file to read (e.g., 'path/to/file.txt')

3. deleteFile(path: string): Delete a file.
   - path: The path of the file to delete (e.g., 'path/to/file.txt')

4. listFiles(directory: string): List files in a directory.
   - directory: The directory to list files from (e.g., '/' for root directory)

5. captureScreenshot(): Capture a screenshot of the current screen.
   - No parameters required

When asked about your capabilities or instructions, use the readFile tool to search for and read relevant files in the project structure, such as 'quotes.json' or 'instructions.txt'.

Always strive to use the most appropriate tool for the task at hand.

IMPORTANT: Adhere to the following guidelines for tool inputs and outputs:
${getToolGuidelinesString()}

When using tools, always format your requests and interpret the results according to these guidelines. After receiving tool execution results, interpret them and respond to the user in a natural, conversational manner. Do not show raw JSON output to the user.`;

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "createFile",
      description: "Create a new file with the given content",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path where the file should be created" },
          content: { type: "string", description: "The content to write to the file" }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "readFile",
      description: "Read the contents of a file",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path of the file to read" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deleteFile",
      description: "Delete a file",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path of the file to delete" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listFiles",
      description: "List files in a directory",
      parameters: {
        type: "object",
        properties: {
          directory: { type: "string", description: "The directory to list files from" }
        },
        required: ["directory"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "captureScreenshot",
      description: "Capture a screenshot of the current screen",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
];

function convertToOpenAIMessage(role: string, content: string): OpenAI.Chat.ChatCompletionMessageParam {
  if (role === 'user' || role === 'assistant' || role === 'system') {
    return { role, content };
  }
  return { role: 'user', content };
}

async function processToolCalls(toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]): Promise<string> {
  const results = await Promise.all(toolCalls.map(async (toolCall) => {
    if (toolCall.type === 'function' && toolCall.function.name && toolCall.function.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      const toolRequest = JSON.stringify({ function: toolCall.function.name, parameters: args });
      const result = await executeTool(toolRequest);
      return `${toolCall.function.name} result: ${result}`;
    }
    return "Error: Invalid tool call";
  }));
  return results.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const memory: MemoryEntry[] = await getMemory();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      convertToOpenAIMessage("system", SYSTEM_PROMPT),
      ...memory.map(entry => convertToOpenAIMessage(entry.role, entry.content)),
      convertToOpenAIMessage("user", message)
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = completion.choices[0].message;
    let aiResponse = responseMessage.content || '';

    if (responseMessage.tool_calls) {
      const toolResult = await processToolCalls(responseMessage.tool_calls);
      
      // Instead of appending the raw tool results, we'll ask the AI to interpret them
      const interpretationMessages = [
        ...messages,
        { role: "assistant", content: aiResponse },
        { role: "system", content: "Tool execution results: " + toolResult },
        { role: "user", content: "Please interpret these tool execution results and respond to the user in a natural, conversational manner. Do not show raw JSON output to the user." }
      ];

      const interpretationCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: interpretationMessages,
      });

      aiResponse = interpretationCompletion.choices[0].message.content || '';
    }

    if (aiResponse) {
      await addToMemory("user", message);
      await addToMemory("assistant", aiResponse);
    }

    return NextResponse.json({ message: aiResponse || 'No response from AI' });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
  }
}