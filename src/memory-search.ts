import { MemoryIndex, SearchResult } from './types';

export class MemorySearchEngine {
  search(query: string, index: MemoryIndex, maxResults?: number): SearchResult[] {
    // TODO: Tokenize query
    // TODO: Search keywords and phrases
    // TODO: Rank by relevance (phrase > keyword)
    // TODO: Attach source metadata
    // TODO: Limit to maxResults
    // TODO: Return sorted by relevance
    return [];
  }

  rankResults(results: SearchResult[]): SearchResult[] {
    // TODO: Sort by relevance score descending
    return results;
  }
}

export function calculateRelevance(
  matchedTerms: string[],
  exactPhrase: boolean
): number {
  // TODO: Score based on match type and term count
  return 0;
}

export function tokenizeQuery(query: string): { keywords: string[]; phrases: string[] } {
  // TODO: Parse query into keywords and phrases
  return { keywords: [], phrases: [] };
}
