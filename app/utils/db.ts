import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db: any;

async function initializeDatabase() {
  if (!db) {
    db = await open({
      filename: './aura.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        role TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE TABLE IF NOT EXISTS audio_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER,
        file_path TEXT,
        duration FLOAT,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      );

      CREATE TABLE IF NOT EXISTS vision_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER,
        image_path TEXT,
        description TEXT,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      );

      CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        key TEXT,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
  }
  return db;
}

export async function getDatabase() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

// Helper functions for database operations

export async function createUser(username: string) {
  const db = await getDatabase();
  return db.run('INSERT INTO users (username) VALUES (?)', username);
}

export async function getOrCreateUser(username: string) {
  const db = await getDatabase();
  let user = await db.get('SELECT * FROM users WHERE username = ?', username);
  if (!user) {
    await createUser(username);
    user = await db.get('SELECT * FROM users WHERE username = ?', username);
  }
  return user;
}

export async function createConversation(userId: number) {
  const db = await getDatabase();
  return db.run('INSERT INTO conversations (user_id) VALUES (?)', userId);
}

export async function addMessage(conversationId: number, role: string, content: string) {
  const db = await getDatabase();
  return db.run('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)', 
    conversationId, role, content);
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDatabase();
  return db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', conversationId);
}

export async function addMemory(userId: number, key: string, value: string) {
  const db = await getDatabase();
  return db.run('INSERT OR REPLACE INTO memory (user_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    userId, key, value);
}

export async function getMemory(userId: number, key: string) {
  const db = await getDatabase();
  return db.get('SELECT value FROM memory WHERE user_id = ? AND key = ?', userId, key);
}

export async function getAllMemory(userId: number) {
  const db = await getDatabase();
  return db.all('SELECT key, value FROM memory WHERE user_id = ?', userId);
}

// Add more helper functions as needed for other tables and operations