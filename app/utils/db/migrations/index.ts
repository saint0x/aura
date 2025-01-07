import { Database } from 'sqlite';
import * as initialSchema from './001_initial_schema';

interface Migration {
  up: (db: Database) => Promise<void>;
  down: (db: Database) => Promise<void>;
}

const migrations: Migration[] = [
  initialSchema
];

export async function runMigrations(db: Database): Promise<void> {
  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get applied migrations
  const appliedMigrations = await db.all('SELECT name FROM migrations');
  const appliedMigrationNames = new Set(appliedMigrations.map(m => m.name));

  // Run pending migrations
  for (const migration of migrations) {
    const migrationName = migration.constructor.name;
    if (!appliedMigrationNames.has(migrationName)) {
      console.log(`Running migration: ${migrationName}`);
      await migration.up(db);
      await db.run('INSERT INTO migrations (name) VALUES (?)', migrationName);
      console.log(`Completed migration: ${migrationName}`);
    }
  }
}

export async function rollbackMigration(db: Database): Promise<void> {
  const lastMigration = await db.get('SELECT name FROM migrations ORDER BY id DESC LIMIT 1');
  if (lastMigration) {
    const migration = migrations.find(m => m.constructor.name === lastMigration.name);
    if (migration) {
      console.log(`Rolling back migration: ${lastMigration.name}`);
      await migration.down(db);
      await db.run('DELETE FROM migrations WHERE name = ?', lastMigration.name);
      console.log(`Rolled back migration: ${lastMigration.name}`);
    }
  }
} 