import { NextRequest, NextResponse } from 'next/server';
import { MemoryEntry } from '../../utils/agent/types';
import { memoryManager } from '../../utils/memoryUtils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const contextId = searchParams.get('context_id');
  const limit = searchParams.get('limit');

  if (!contextId) {
    return NextResponse.json({ error: 'Missing context_id parameter' }, { status: 400 });
  }

  try {
    const entries = await memoryManager.getRecentEntries(
      contextId,
      limit ? parseInt(limit, 10) : undefined
    );
    return NextResponse.json(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context_id, content, type, metadata } = body;

    if (!context_id || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: context_id, content, type' },
        { status: 400 }
      );
    }

    await memoryManager.store(context_id, content, type, metadata);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}