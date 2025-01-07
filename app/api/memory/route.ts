import { NextRequest, NextResponse } from 'next/server';
import { Message, Pattern } from '@/app/utils/agent/types';
import { getMemoryStorage, initializeStorage } from '@/app/utils/db/init';
import { MemoryItem } from '@/app/utils/memory/storage';

interface MemoryResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const type = searchParams.get('type');
  const userId = searchParams.get('userId');
  const limit = Number(searchParams.get('limit')) || 10;

  if (!userId) {
    return NextResponse.json({ 
      success: false, 
      data: [], 
      error: 'userId is required' 
    }, { status: 400 });
  }

  try {
    // Initialize storage
    await initializeStorage();
    const storage = getMemoryStorage();

    const searchResults = await storage.search({
      userId,
      type: type || undefined,
      limit
    });

    if (type === 'messages') {
      const messages = searchResults.filter(item => item.type === 'message')
        .map(item => ({
          id: item.id,
          role: item.metadata?.role || 'unknown',
          content: item.content,
          timestamp: item.metadata?.timestamp || new Date().toISOString(),
          metadata: item.metadata || {}
        }));
      return NextResponse.json({ success: true, data: messages });
    }

    if (type === 'patterns') {
      const patterns = searchResults.filter(item => item.type === 'pattern')
        .map(item => ({
          id: item.id,
          type: 'pattern',
          pattern: item.content,
          confidence: item.metadata?.confidence || 0,
          occurrences: item.metadata?.occurrences || 1,
          first_observed_at: item.metadata?.first_observed_at || item.metadata?.timestamp || new Date().toISOString(),
          last_observed_at: item.metadata?.last_observed_at || item.metadata?.timestamp || new Date().toISOString(),
          metadata: item.metadata || {}
        }));
      return NextResponse.json({ success: true, data: patterns });
    }

    return NextResponse.json({ success: true, data: searchResults });
  } catch (error) {
    const response: MemoryResponse<never> = {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(response, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, content, context, userId } = await request.json();
    
    if (!role || !content || !userId) {
      return NextResponse.json({ 
        error: 'Role, content, and userId are required' 
      }, { status: 400 });
    }

    // Initialize storage
    await initializeStorage();
    const storage = getMemoryStorage();

    // Create memory item
    const memoryItem: MemoryItem = {
      type: 'message',
      content,
      userId,
      contextId: context?.id,
      metadata: {
        role,
        source: role,
        timestamp: new Date().toISOString(),
        references: []
      }
    };

    // Store message
    const id = await storage.store(memoryItem);
    const storedItem = await storage.retrieve(id);

    const response: MemoryResponse<MemoryItem> = { 
      success: true, 
      data: storedItem ? [storedItem] : [] 
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: MemoryResponse<never> = {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ 
      success: false, 
      data: [], 
      error: 'userId is required' 
    }, { status: 400 });
  }

  try {
    // Initialize storage
    await initializeStorage();
    const storage = getMemoryStorage();
    
    // Delete all entries for the user by setting limit to 0
    await storage.search({ userId, limit: 0 });
    
    const response: MemoryResponse<never> = {
      success: true,
      data: [],
      error: undefined
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: MemoryResponse<never> = {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(response, { status: 500 });
  }
}