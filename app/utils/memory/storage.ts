import { getDatabase } from '../db/client';
import { DatabaseError } from '../db/types';
import { generateId } from '../common/helpers';

export interface MemoryItem {
  id?: string;
  type: string;
  content: string;
  userId: string;
  contextId?: string;
  metadata?: Record<string, any>;
  embedding?: Buffer;
}

export interface BaseMemoryItem {
  id: string;
  type: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export class MemoryStorage {
  private tableName: string;
  private maxEntries: number;
  private initialized: boolean = false;

  constructor(config: { tableName: string; maxEntries: number }) {
    this.tableName = config.tableName;
    this.maxEntries = config.maxEntries;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const db = await getDatabase();
      // Table is already created by migrations
      this.initialized = true;
    } catch (error) {
      throw new DatabaseError({
        message: 'Failed to initialize memory storage',
        cause: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }

  async store(item: MemoryItem): Promise<string> {
    if (!this.initialized) {
      throw new DatabaseError({ message: 'Memory storage not initialized' });
    }

    try {
      const db = await getDatabase();
      const id = item.id || generateId();
      
      await db.run(
        `INSERT INTO memory_entries (
          id, user_id, content, type, context_id, embedding, metadata,
          created_at, last_accessed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          id,
          item.userId,
          item.content,
          item.type,
          item.contextId || null,
          item.embedding || null,
          JSON.stringify(item.metadata || {})
        ]
      );

      // Enforce max entries limit
      await this.enforceLimit(item.userId);
      
      return id;
    } catch (error) {
      throw new DatabaseError({
        message: 'Failed to store item in memory',
        cause: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }

  async retrieve(id: string): Promise<MemoryItem | null> {
    if (!this.initialized) {
      throw new DatabaseError({ message: 'Memory storage not initialized' });
    }

    try {
      const db = await getDatabase();
      const result = await db.get(
        'SELECT * FROM memory_entries WHERE id = ?',
        [id]
      );

      if (!result) return null;

      // Update last accessed timestamp
      await db.run(
        'UPDATE memory_entries SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      return {
        id: result.id,
        type: result.type,
        content: result.content,
        userId: result.user_id,
        contextId: result.context_id,
        metadata: JSON.parse(result.metadata),
        embedding: result.embedding
      };
    } catch (error) {
      throw new DatabaseError({
        message: 'Failed to retrieve item from memory',
        cause: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }

  async search(query: {
    userId: string;
    type?: string;
    contextId?: string;
    limit?: number;
  }): Promise<MemoryItem[]> {
    if (!this.initialized) {
      throw new DatabaseError({ message: 'Memory storage not initialized' });
    }

    try {
      const db = await getDatabase();
      let sql = 'SELECT * FROM memory_entries WHERE user_id = ?';
      const params: any[] = [query.userId];

      if (query.type) {
        sql += ' AND type = ?';
        params.push(query.type);
      }

      if (query.contextId) {
        sql += ' AND context_id = ?';
        params.push(query.contextId);
      }

      sql += ' ORDER BY created_at DESC';
      
      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(query.limit);
      }

      const results = await db.all(sql, params);

      return results.map(result => ({
        id: result.id,
        type: result.type,
        content: result.content,
        userId: result.user_id,
        contextId: result.context_id,
        metadata: JSON.parse(result.metadata),
        embedding: result.embedding
      }));
    } catch (error) {
      throw new DatabaseError({
        message: 'Failed to search memory',
        cause: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }

  private async enforceLimit(userId: string): Promise<void> {
    const db = await getDatabase();
    const count = await db.get(
      'SELECT COUNT(*) as count FROM memory_entries WHERE user_id = ?',
      [userId]
    );

    if (count.count > this.maxEntries) {
      const toDelete = count.count - this.maxEntries;
      await db.run(
        `DELETE FROM memory_entries 
        WHERE id IN (
          SELECT id FROM memory_entries 
          WHERE user_id = ? 
          ORDER BY last_accessed_at ASC 
          LIMIT ?
        )`,
        [userId, toDelete]
      );
    }
  }
}
