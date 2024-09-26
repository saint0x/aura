import { NextRequest, NextResponse } from 'next/server';
import { addToMemory, getMemory, clearMemory } from '../../utils/memoryUtils';

export async function GET() {
  try {
    const memory = getMemory();
    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error retrieving memory:', error);
    return NextResponse.json({ error: 'Failed to retrieve memory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, content } = await request.json();
    
    if (!role || !content) {
      return NextResponse.json({ error: 'Role and content are required' }, { status: 400 });
    }

    addToMemory(role, content);
    return NextResponse.json({ message: 'Memory added successfully' });
  } catch (error) {
    console.error('Error adding to memory:', error);
    return NextResponse.json({ error: 'Failed to add to memory' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearMemory();
    return NextResponse.json({ message: 'Memory cleared successfully' });
  } catch (error) {
    console.error('Error clearing memory:', error);
    return NextResponse.json({ error: 'Failed to clear memory' }, { status: 500 });
  }
}