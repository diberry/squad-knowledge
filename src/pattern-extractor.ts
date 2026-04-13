import { PatternMatch, PatternContext } from './types';

const STOPLIST = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

export class PatternExtractor {
  private minFrequency: number;
  private minPhraseLength: number;

  constructor(minFrequency = 3, minPhraseLength = 3) {
    this.minFrequency = minFrequency;
    this.minPhraseLength = minPhraseLength;
  }

  extract(entries: string[], metadata: PatternContext[]): PatternMatch[] {
    // TODO: Extract n-grams from entries
    // TODO: Filter by length and stoplist
    // TODO: Count frequencies
    // TODO: Return patterns sorted by frequency
    return [];
  }
}

export function extractPatterns(
  text: string,
  agentName: string,
  sessionId: string,
  timestamp: Date
): PatternMatch[] {
  // TODO: Implement pattern extraction logic
  return [];
}
