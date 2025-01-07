import { promises as fs } from 'fs';
import path from 'path';
import { QuoteExample, QuoteCategory, ToolQuotes } from './agent/types';

let toolQuotes: ToolQuotes | null = null;

export async function loadQuotes(): Promise<ToolQuotes> {
  if (toolQuotes) {
    return toolQuotes;
  }

  try {
    const quotesPath = path.join(process.cwd(), 'data', 'quotes.json');
    const quotesData = await fs.readFile(quotesPath, 'utf-8');
    toolQuotes = JSON.parse(quotesData) as ToolQuotes;
    return toolQuotes;
  } catch (error) {
    console.error('Failed to load quotes:', error);
    throw new Error('Failed to load quotes');
  }
}

export async function saveQuotes(quotes: ToolQuotes): Promise<void> {
  try {
    const quotesPath = path.join(process.cwd(), 'data', 'quotes.json');
    await fs.writeFile(quotesPath, JSON.stringify(quotes, null, 2));
    toolQuotes = quotes;
  } catch (error) {
    console.error('Failed to save quotes:', error);
    throw new Error('Failed to save quotes');
  }
}

export async function addQuote(
  category: string,
  trigger: string,
  response: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const quotes = await loadQuotes();
  
  if (!quotes.categories[category]) {
    quotes.categories[category] = {
      name: category,
      description: `Quotes for ${category}`,
      examples: [],
      metadata: {}
    };
  }

  const example: QuoteExample = {
    trigger,
    response,
    metadata
  };

  quotes.categories[category].examples.push(example);
  await saveQuotes(quotes);
}

export async function findQuote(trigger: string): Promise<QuoteExample | null> {
  const quotes = await loadQuotes();
  
  for (const category of Object.values(quotes.categories)) {
    const example = category.examples.find(e => e.trigger === trigger);
    if (example) {
      return example;
    }
  }

  return null;
}

export async function getRandomQuote(category?: string): Promise<QuoteExample | null> {
  const quotes = await loadQuotes();
  
  let examples: QuoteExample[] = [];
  
  if (category) {
    examples = quotes.categories[category]?.examples || [];
  } else {
    Object.values(quotes.categories).forEach(cat => {
      examples = examples.concat(cat.examples);
    });
  }

  if (examples.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * examples.length);
  return examples[randomIndex];
}

export async function removeQuote(trigger: string): Promise<boolean> {
  const quotes = await loadQuotes();
  let removed = false;

  for (const category of Object.values(quotes.categories)) {
    const index = category.examples.findIndex(e => e.trigger === trigger);
    if (index !== -1) {
      category.examples.splice(index, 1);
      removed = true;
      break;
    }
  }

  if (removed) {
    await saveQuotes(quotes);
  }

  return removed;
}

export async function updateQuote(
  trigger: string,
  newResponse: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const quotes = await loadQuotes();
  let updated = false;

  for (const category of Object.values(quotes.categories)) {
    const example = category.examples.find(e => e.trigger === trigger);
    if (example) {
      example.response = newResponse;
      if (metadata) {
        example.metadata = { ...example.metadata, ...metadata };
      }
      updated = true;
      break;
    }
  }

  if (updated) {
    await saveQuotes(quotes);
  }

  return updated;
} 