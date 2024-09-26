import { getOrCreateUser, addMemory, getAllMemory } from './db';

export type MemoryEntry = {
  role: string;
  content: string;
  timestamp: number;
};

type DBMemoryEntry = {
  key: string;
  value: string;
};

const DEFAULT_USERNAME = 'default_user';

export async function addToMemory(role: string, content: string): Promise<void> {
  const user = await getOrCreateUser(DEFAULT_USERNAME);
  const timestamp = Date.now();
  await addMemory(user.id, `${timestamp}`, JSON.stringify({ role, content, timestamp }));
  console.log('Adding to memory:', { role, content, timestamp });
}

export async function getMemory(): Promise<MemoryEntry[]> {
  console.log('Retrieving memory');
  const user = await getOrCreateUser(DEFAULT_USERNAME);
  const memoryEntries: DBMemoryEntry[] = await getAllMemory(user.id);
  return memoryEntries
    .map((entry: DBMemoryEntry) => JSON.parse(entry.value) as MemoryEntry)
    .sort((a: MemoryEntry, b: MemoryEntry) => a.timestamp - b.timestamp);
}

export async function clearMemory(): Promise<void> {
  console.log('Clearing memory');
  // Implement clearing memory from the database
  // This might involve deleting all memory entries for the user
  // or marking them as inactive
}

// Add any other memory-related utility functions as needed
