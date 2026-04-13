import { MemoryIndex, MemoryDocument, SearchResult } from './types';

export class MemorySearchEngine {
  search(query: string, index: MemoryIndex, maxResults?: number): SearchResult[] {
    const { keywords, phrases } = tokenizeQuery(query);
    const resultMap = new Map<string, SearchResult>();

    // Search phrase index (higher relevance)
    for (const phrase of phrases) {
      const docs = index.phraseIndex.get(phrase) || [];
      for (const doc of docs) {
        const existing = resultMap.get(doc.id);
        if (existing) {
          existing.matchedTerms.push(phrase);
          existing.relevanceScore += 3; // phrase match bonus
        } else {
          resultMap.set(doc.id, {
            document: doc,
            matchedTerms: [phrase],
            relevanceScore: 3,
          });
        }
      }
    }

    // Search keyword index
    for (const keyword of keywords) {
      const docs = index.keywordIndex.get(keyword) || [];
      for (const doc of docs) {
        const existing = resultMap.get(doc.id);
        if (existing) {
          if (!existing.matchedTerms.includes(keyword)) {
            existing.matchedTerms.push(keyword);
            existing.relevanceScore += 1;
          }
        } else {
          resultMap.set(doc.id, {
            document: doc,
            matchedTerms: [keyword],
            relevanceScore: 1,
          });
        }
      }
    }

    // Also do full-text scan for exact query phrase match
    const queryLower = query.toLowerCase();
    for (const doc of index.documents) {
      if (doc.content.toLowerCase().includes(queryLower)) {
        const existing = resultMap.get(doc.id);
        if (existing) {
          existing.relevanceScore += 5; // exact phrase in content
        } else {
          resultMap.set(doc.id, {
            document: doc,
            matchedTerms: [query],
            relevanceScore: 5,
          });
        }
      }
    }

    let results = this.rankResults([...resultMap.values()]);

    if (maxResults && maxResults > 0) {
      results = results.slice(0, maxResults);
    }

    return results;
  }

  rankResults(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

export function calculateRelevance(
  matchedTerms: string[],
  exactPhrase: boolean
): number {
  let score = matchedTerms.length;
  if (exactPhrase) score += 5;
  return score;
}

export function tokenizeQuery(query: string): { keywords: string[]; phrases: string[] } {
  const words = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);
  const phrases: string[] = [];

  // Build bigrams as phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  return { keywords: words, phrases };
}
