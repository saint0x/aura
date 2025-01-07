import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { runMigrations } from './migrations';

let db: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: './aura.db',
      driver: sqlite3.Database
    });

    // Run migrations
    await runMigrations(db);
  }
  return db;
}

export async function getDatabase(): Promise<Database> {
  if (!db) {
    await initializeDatabase();
  }
  return db!;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

// Helper functions for database operations

export async function createUser(name: string, email: string): Promise<void> {
  const db = await getDatabase();
  await db.run(
    'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
    crypto.randomUUID(), name, email
  );
}

export async function getUser(email: string) {
  const db = await getDatabase();
  return db.get('SELECT * FROM users WHERE email = ?', email);
}

export async function createSession(userId: string): Promise<string> {
  const db = await getDatabase();
  const sessionId = crypto.randomUUID();
  await db.run(
    'INSERT INTO sessions (id, user_id) VALUES (?, ?)',
    sessionId, userId
  );
  return sessionId;
}

export async function addMessage(
  sessionId: string,
  role: string,
  content: string,
  contextId?: string,
  toolCalls?: any[],
  audioUrl?: string,
  transcription?: string
): Promise<void> {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO messages (
      id, session_id, role, content, context_id, tool_calls, audio_url, transcription
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    sessionId,
    role,
    content,
    contextId,
    toolCalls ? JSON.stringify(toolCalls) : null,
    audioUrl,
    transcription
  );
}

export async function getSessionMessages(sessionId: string) {
  const db = await getDatabase();
  return db.all('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp', sessionId);
}

export async function storeMemory(
  userId: string,
  content: string,
  type: string,
  contextId?: string,
  embedding?: Buffer,
  metadata: Record<string, any> = {}
): Promise<void> {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO memory_entries (
      id, user_id, content, type, context_id, embedding, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    userId,
    content,
    type,
    contextId,
    embedding,
    JSON.stringify(metadata)
  );
}

export async function searchMemory(
  userId: string,
  type?: string,
  contextId?: string,
  limit: number = 10
) {
  const db = await getDatabase();
  let query = 'SELECT * FROM memory_entries WHERE user_id = ?';
  const params: any[] = [userId];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (contextId) {
    query += ' AND context_id = ?';
    params.push(contextId);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  return db.all(query, ...params);
}

export async function logToolExecution(
  toolId: string,
  sessionId: string,
  parameters: Record<string, any>,
  status: string,
  result?: any,
  error?: string,
  duration?: number
): Promise<void> {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO tool_executions (
      id, tool_id, session_id, parameters, status, result, error, duration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    toolId,
    sessionId,
    JSON.stringify(parameters),
    status,
    result ? JSON.stringify(result) : null,
    error,
    duration
  );
}

export async function cacheEmbedding(
  content: string,
  embedding: Buffer,
  modelVersion: string
): Promise<void> {
  const db = await getDatabase();
  const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));

  await db.run(
    `INSERT OR REPLACE INTO embeddings_cache (
      id, content_hash, embedding, model_version
    ) VALUES (?, ?, ?, ?)`,
    crypto.randomUUID(),
    contentHash,
    embedding,
    modelVersion
  );
}

export async function getCachedEmbedding(content: string, modelVersion: string) {
  const db = await getDatabase();
  const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));

  return db.get(
    'SELECT * FROM embeddings_cache WHERE content_hash = ? AND model_version = ?',
    contentHash,
    modelVersion
  );
}

export async function cacheResponse(
  query: string,
  response: any,
  modelName: string,
  tokensUsed: number,
  expiresIn: number = 3600 // 1 hour default
): Promise<void> {
  const db = await getDatabase();
  const queryHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(query))
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await db.run(
    `INSERT OR REPLACE INTO response_cache (
      id, query_hash, response, model_name, tokens_used, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    queryHash,
    JSON.stringify(response),
    modelName,
    tokensUsed,
    expiresAt
  );
}

export async function getCachedResponse(query: string) {
  const db = await getDatabase();
  const queryHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(query))
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));

  const result = await db.get(
    'SELECT * FROM response_cache WHERE query_hash = ? AND expires_at > CURRENT_TIMESTAMP',
    queryHash
  );

  if (result) {
    await db.run(
      'UPDATE response_cache SET use_count = use_count + 1 WHERE query_hash = ?',
      queryHash
    );
  }

  return result;
}