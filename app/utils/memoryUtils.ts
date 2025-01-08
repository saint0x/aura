import { MemoryEntry, MemoryType, MemoryState } from '@/app/utils/agent/types';
import { getMemoryStorage } from './db/init';
import { DatabaseError } from './db/types';
import { MemoryItem } from './memory/storage';

export class MemoryManager {
  private convertToMemoryEntry(item: MemoryItem): MemoryEntry {
    return {
      id: item.id!,
      type: item.type as MemoryEntry['type'],
      content: item.content,
      context_id: item.contextId!,
      metadata: item.metadata || {},
      timestamp: new Date().toISOString()
    };
  }

  async getMemoryState(contextId: string): Promise<MemoryState> {
    const storage = getMemoryStorage();
    const [operations, patterns, contexts] = await Promise.all([
      storage.search({ userId: contextId, type: 'operation', limit: 10 }),
      storage.search({ userId: contextId, type: 'pattern', limit: 100 }),
      storage.search({ userId: contextId, type: 'context', limit: 100 })
    ]);

    return {
      recent_operations: operations.map(op => ({
        id: op.id!,
        type: op.type,
        status: op.metadata?.status || 'completed',
        created_at: op.metadata?.created_at || new Date().toISOString(),
        updated_at: op.metadata?.updated_at || new Date().toISOString(),
        metadata: op.metadata || {}
      })),
      active_contexts: contexts
        .filter(ctx => ctx.metadata?.active)
        .map(ctx => ctx.id!),
      user_preferences: {},
      conversation_history: [],
      learned_patterns: patterns.map(pattern => ({
        id: pattern.id!,
        type: pattern.type,
        content: pattern.content,
        pattern: pattern.metadata?.pattern || '',
        last_observed: pattern.metadata?.last_observed || new Date().toISOString(),
        timestamp: pattern.metadata?.timestamp || new Date().toISOString(),
        confidence: pattern.metadata?.confidence || 0,
        metadata: pattern.metadata || {}
      })),
      saved_contexts: contexts.map(ctx => ({
        id: ctx.id!,
        name: ctx.metadata?.name || '',
        description: ctx.metadata?.description || '',
        type: ctx.type,
        data: ctx.metadata?.data || {},
        updated_at: ctx.metadata?.updated_at || new Date().toISOString()
      }))
    };
  }

  async getRecentEntries(contextId: string, limit: number = 10): Promise<MemoryEntry[]> {
    const storage = getMemoryStorage();
    const items = await storage.search({ userId: contextId, limit });
    return items.map(item => this.convertToMemoryEntry(item));
  }

  async addEntry(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<void> {
    const storage = getMemoryStorage();
    await storage.store({
      userId: entry.context_id,
      type: entry.type,
      content: entry.content,
      metadata: entry.metadata,
      contextId: entry.context_id
    });
  }

  async searchMemory(
    contextId: string,
    query: string,
    options: {
      type?: string;
      metadata?: Record<string, unknown>;
      limit?: number;
    } = {}
  ): Promise<MemoryEntry[]> {
    const storage = getMemoryStorage();
    const { type, limit } = options;
    
    const items = await storage.search({
      userId: contextId,
      type,
      limit,
      contextId
    });

    return items.map(item => this.convertToMemoryEntry(item));
  }

  async store(
    contextId: string,
    content: string,
    type: MemoryEntry['type'],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const storage = getMemoryStorage();
    await storage.store({
      userId: contextId,
      type,
      content,
      metadata,
      contextId
    });
  }

  async retrieve(id: string): Promise<MemoryEntry | null> {
    const storage = getMemoryStorage();
    const entry = await storage.retrieve(id);
    
    if (!entry) return null;
    
    return this.convertToMemoryEntry(entry);
  }

  async clearContext(contextId: string): Promise<void> {
    // TODO: Implement clear context in storage
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager(); 