import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
  await db.exec(`
    -- Core Tables
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME,
      preferences TEXT NOT NULL DEFAULT '{}',
      settings TEXT NOT NULL DEFAULT '{}',
      voice_settings TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      context TEXT NOT NULL DEFAULT '{}',
      metadata TEXT NOT NULL DEFAULT '{}',
      tools_used TEXT NOT NULL DEFAULT '[]',
      system_prompt TEXT
    );

    CREATE TABLE IF NOT EXISTS operations (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      metadata TEXT NOT NULL DEFAULT '{}',
      error TEXT,
      duration INTEGER,
      tool_name TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      context_id TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      tool_calls TEXT,
      audio_url TEXT,
      transcription TEXT,
      tokens_used INTEGER,
      model_name TEXT
    );

    -- Memory & Learning
    CREATE TABLE IF NOT EXISTS memory_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      context_id TEXT,
      embedding BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT NOT NULL DEFAULT '{}',
      relevance_score REAL,
      last_accessed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      confidence REAL NOT NULL,
      occurrences INTEGER NOT NULL DEFAULT 1,
      first_observed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_observed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT NOT NULL DEFAULT '{}',
      embedding BLOB
    );

    CREATE TABLE IF NOT EXISTS contexts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      metadata TEXT NOT NULL DEFAULT '{}',
      parent_context_id TEXT REFERENCES contexts(id),
      embedding BLOB
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      schedule TEXT,
      context_id TEXT REFERENCES contexts(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      metadata TEXT NOT NULL DEFAULT '{}',
      priority INTEGER DEFAULT 0,
      dependencies TEXT
    );

    -- Tools & Resources
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      version TEXT NOT NULL,
      category TEXT NOT NULL,
      parameters TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS tool_executions (
      id TEXT PRIMARY KEY,
      tool_id TEXT REFERENCES tools(id),
      session_id TEXT REFERENCES sessions(id),
      parameters TEXT NOT NULL,
      result TEXT,
      status TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      error TEXT,
      duration INTEGER,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    -- Cache & Performance
    CREATE TABLE IF NOT EXISTS embeddings_cache (
      id TEXT PRIMARY KEY,
      content_hash TEXT NOT NULL UNIQUE,
      embedding BLOB NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      use_count INTEGER DEFAULT 1,
      model_version TEXT
    );

    CREATE TABLE IF NOT EXISTS response_cache (
      id TEXT PRIMARY KEY,
      query_hash TEXT NOT NULL UNIQUE,
      response TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      use_count INTEGER DEFAULT 1,
      model_name TEXT,
      tokens_used INTEGER
    );

    CREATE TABLE IF NOT EXISTS tool_results_cache (
      id TEXT PRIMARY KEY,
      tool_name TEXT NOT NULL,
      params_hash TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      use_count INTEGER DEFAULT 1
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_operations_session_id ON operations(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
    CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON contexts(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tool_executions_session_id ON tool_executions(session_id);
    CREATE INDEX IF NOT EXISTS idx_memory_entries_user_id ON memory_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_memory_entries_context_id ON memory_entries(context_id);
    
    -- Cache indexes
    CREATE INDEX IF NOT EXISTS idx_embeddings_cache_content_hash ON embeddings_cache(content_hash);
    CREATE INDEX IF NOT EXISTS idx_response_cache_query_hash ON response_cache(query_hash);
    CREATE INDEX IF NOT EXISTS idx_tool_results_cache_params_hash ON tool_results_cache(params_hash);
  `);
}

export async function down(db: Database): Promise<void> {
  await db.exec(`
    DROP TABLE IF EXISTS tool_results_cache;
    DROP TABLE IF EXISTS response_cache;
    DROP TABLE IF EXISTS embeddings_cache;
    DROP TABLE IF EXISTS tool_executions;
    DROP TABLE IF EXISTS tools;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS contexts;
    DROP TABLE IF EXISTS patterns;
    DROP TABLE IF EXISTS memory_entries;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS operations;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS users;
  `);
} 