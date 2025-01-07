import { initializeDatabase, closeDatabase } from './client';
import { MemoryStorage } from '../memory/storage';
import { MEMORY } from '../common/constants';

let memoryStorage: MemoryStorage | null = null;

export async function initializeStorage(): Promise<void> {
  try {
    // Initialize database first
    await initializeDatabase();

    // Initialize memory storage
    if (!memoryStorage) {
      memoryStorage = new MemoryStorage({
        tableName: 'memory_entries',
        maxEntries: MEMORY.MAX_ENTRIES
      });
      await memoryStorage.initialize();
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
}

export function getMemoryStorage(): MemoryStorage {
  if (!memoryStorage) {
    throw new Error('Memory storage not initialized. Call initializeStorage first.');
  }
  return memoryStorage;
}

export async function closeStorage(): Promise<void> {
  try {
    // Close memory storage if needed
    memoryStorage = null;

    // Close database connection
    await closeDatabase();
  } catch (error) {
    console.error('Failed to close storage:', error);
    throw error;
  }
} 