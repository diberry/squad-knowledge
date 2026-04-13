import { MemoryIndex, MemoryDocument } from './types';
import { randomUUID } from 'node:crypto';

const INDEX_STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'it', 'this', 'that',
]);

export class MemoryIndexer {
  indexAgentHistories(agentHistories: Map<string, string[]>): MemoryIndex {
    const documents: MemoryDocument[] = [];

    for (const [agentName, entries] of agentHistories) {
      for (const entry of entries) {
        if (!entry || typeof entry !== 'string') continue;

        try {
          const keywords = tokenizeText(entry);
          const phrases = extractPhrases(entry);

          documents.push({
            id: randomUUID(),
            source: 'agent_history',
            sourceAgent: agentName,
            content: entry,
            author: agentName,
            timestamp: new Date(),
            keywords,
            phrases,
          });
        } catch {
          // Log warning but continue indexing valid entries
          console.warn(`Skipping malformed entry from agent ${agentName}`);
        }
      }
    }

    const keywordIndex = this.buildKeywordIndex(documents);
    const phraseIndex = this.buildPhraseIndex(documents);

    return { documents, keywordIndex, phraseIndex, lastUpdated: new Date() };
  }

  indexDecisions(decisionsContent: string, author: string): MemoryDocument[] {
    const documents: MemoryDocument[] = [];
    // Split on common decision entry delimiters
    const entries = decisionsContent.split(/\n(?=##\s|---|\d+\.\s)/).filter(e => e.trim());

    for (const entry of entries) {
      const keywords = tokenizeText(entry);
      const phrases = extractPhrases(entry);

      documents.push({
        id: randomUUID(),
        source: 'decisions',
        content: entry.trim(),
        author,
        timestamp: new Date(),
        keywords,
        phrases,
      });
    }

    return documents;
  }

  buildKeywordIndex(documents: MemoryDocument[]): Map<string, MemoryDocument[]> {
    const index = new Map<string, MemoryDocument[]>();

    for (const doc of documents) {
      for (const keyword of doc.keywords) {
        const existing = index.get(keyword) || [];
        existing.push(doc);
        index.set(keyword, existing);
      }
    }

    return index;
  }

  buildPhraseIndex(documents: MemoryDocument[]): Map<string, MemoryDocument[]> {
    const index = new Map<string, MemoryDocument[]>();

    for (const doc of documents) {
      for (const phrase of doc.phrases) {
        const existing = index.get(phrase) || [];
        existing.push(doc);
        index.set(phrase, existing);
      }
    }

    return index;
  }
}

export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !INDEX_STOPWORDS.has(w));
}

export function extractPhrases(text: string): string[] {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  const phrases: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  return phrases;
}
