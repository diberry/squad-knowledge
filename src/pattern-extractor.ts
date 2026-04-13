import { PatternMatch, PatternContext } from './types';

const STOPLIST = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'it', 'this', 'that',
  'be', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'not', 'no',
  'so', 'if', 'then', 'than', 'as', 'from', 'by', 'up', 'out',
]);

export class PatternExtractor {
  private minFrequency: number;
  private minPhraseLength: number;

  constructor(minFrequency = 3, minPhraseLength = 3) {
    this.minFrequency = minFrequency;
    this.minPhraseLength = minPhraseLength;
  }

  extract(entries: string[], metadata: PatternContext[]): PatternMatch[] {
    const phraseCounts = new Map<string, { count: number; contexts: PatternContext[] }>();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const context = metadata[i] || { agentName: 'unknown', sessionId: 'unknown', timestamp: new Date(), snippet: entry };
      const ngrams = this.extractNgrams(entry);

      for (const ngram of ngrams) {
        const normalized = ngram.toLowerCase();
        if (this.isNoise(normalized)) continue;

        const existing = phraseCounts.get(normalized) || { count: 0, contexts: [] };
        existing.count++;
        existing.contexts.push({ ...context, snippet: entry });
        phraseCounts.set(normalized, existing);
      }
    }

    const results: PatternMatch[] = [];
    for (const [text, data] of phraseCounts) {
      if (data.count >= this.minFrequency) {
        results.push({
          text,
          count: data.count,
          contexts: data.contexts,
          frequency: data.count >= 10 ? 'high' : data.count >= 5 ? 'medium' : 'low',
        });
      }
    }

    return results.sort((a, b) => b.count - a.count);
  }

  private extractNgrams(text: string): string[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    const ngrams: string[] = [];

    for (let size = this.minPhraseLength; size <= Math.min(words.length, 7); size++) {
      for (let i = 0; i <= words.length - size; i++) {
        ngrams.push(words.slice(i, i + size).join(' '));
      }
    }

    return ngrams;
  }

  private isNoise(phrase: string): boolean {
    const words = phrase.split(' ');
    if (words.length < this.minPhraseLength) return true;
    // Filter phrases where all words are stopwords
    if (words.every(w => STOPLIST.has(w))) return true;
    return false;
  }
}

export function extractPatterns(
  text: string,
  agentName: string,
  sessionId: string,
  timestamp: Date
): PatternMatch[] {
  const extractor = new PatternExtractor(1, 3);
  const context: PatternContext = { agentName, sessionId, timestamp, snippet: text };
  return extractor.extract([text], [context]);
}
