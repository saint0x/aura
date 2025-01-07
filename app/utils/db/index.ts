import type { DatabaseClient, DatabaseConfig } from './types';
import { SQLiteClient } from './sqlite';

export * from './types';

let client: DatabaseClient | null = null;

export async function initializeDatabase(config: DatabaseConfig): Promise<DatabaseClient> {
  if (client) {
    await client.close();
  }

  switch (config.type) {
    case 'sqlite':
      client = new SQLiteClient(config);
      break;
    // Add other database implementations here
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }

  return client;
}

export function getClient(): DatabaseClient {
  if (!client) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return client;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}

// Default configuration for SQLite
export const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  connection: {
    filename: process.env.DATABASE_URL || ':memory:'
  },
  options: {
    debug: process.env.NODE_ENV === 'development'
  }
}; 