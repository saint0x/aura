import { Database } from 'sqlite3';
import { open, Database as SQLite } from 'sqlite';
import {
  DatabaseClient,
  DatabaseConfig,
  DatabaseError,
  QueryResult,
  DatabaseErrorOptions
} from './types';

export class SQLiteClient implements DatabaseClient {
  private db: SQLite | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  private async ensureConnection(): Promise<SQLite> {
    if (!this.db) {
      try {
        this.db = await open({
          filename: (this.config.connection.filename as string) || ':memory:',
          driver: Database
        });

        // Enable foreign keys
        await this.db.run('PRAGMA foreign_keys = ON');

        // Set busy timeout
        if (this.config.options?.timeout) {
          await this.db.run(`PRAGMA busy_timeout = ${this.config.options.timeout}`);
        }
      } catch (error) {
        throw new DatabaseError({
          message: `Failed to connect to SQLite database: ${(error as Error).message}`,
          cause: error as Error
        });
      }
    }
    return this.db;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const db = await this.ensureConnection();
    
    try {
      const rows = await db.all(sql, params);
      return {
        rows: rows as T[],
        rowCount: rows.length
      };
    } catch (error) {
      throw new DatabaseError({
        message: `Query failed: ${(error as Error).message}`,
        cause: error as Error
      });
    }
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    const db = await this.ensureConnection();
    
    try {
      await db.run(sql, params);
    } catch (error) {
      throw new DatabaseError({
        message: `Execute failed: ${(error as Error).message}`,
        cause: error as Error
      });
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const db = await this.ensureConnection();
    
    try {
      await db.run('BEGIN');
      const result = await callback();
      await db.run('COMMIT');
      return result;
    } catch (error) {
      await db.run('ROLLBACK');
      throw new DatabaseError({
        message: `Transaction failed: ${(error as Error).message}`,
        cause: error as Error
      });
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
      } catch (error) {
        throw new DatabaseError({
          message: `Failed to close database: ${(error as Error).message}`,
          cause: error as Error
        });
      }
    }
  }
} 