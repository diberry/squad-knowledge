import { describe, it, expect } from 'vitest';
import { PatternExtractor, extractPatterns } from '../src/pattern-extractor';
import { PatternContext } from '../src/types';

describe('PatternExtractor', () => {
  it('extracts repeated phrases from agent histories', () => {
    const entries = [
      'always check for null before accessing properties',
      'we should always check for null before accessing any field',
      'always check for null before accessing the data',
      'remember to validate the input first',
    ];
    const metadata: PatternContext[] = entries.map((e, i) => ({
      agentName: `Agent${i}`,
      sessionId: `session-${i}`,
      timestamp: new Date(),
      snippet: e,
    }));

    const extractor = new PatternExtractor(3, 3);
    const patterns = extractor.extract(entries, metadata);

    expect(patterns.length).toBeGreaterThan(0);
    const topPattern = patterns[0];
    expect(topPattern.count).toBeGreaterThanOrEqual(3);
    expect(topPattern.text.split(' ').length).toBeGreaterThanOrEqual(3);
    expect(topPattern.contexts.length).toBeGreaterThanOrEqual(3);
  });

  it('filters out noise patterns (single words, common articles)', () => {
    const entries = [
      'the and or but is are was were',
      'the and or but is are was were',
      'the and or but is are was were',
      'always validate user input before parsing',
      'always validate user input before parsing',
      'always validate user input before parsing',
    ];
    const metadata: PatternContext[] = entries.map((e, i) => ({
      agentName: 'Agent1',
      sessionId: `s-${i}`,
      timestamp: new Date(),
      snippet: e,
    }));

    const extractor = new PatternExtractor(3, 3);
    const patterns = extractor.extract(entries, metadata);

    // All-stopword phrases should be filtered out
    for (const p of patterns) {
      const words = p.text.split(' ');
      expect(words.length).toBeGreaterThanOrEqual(3);
      // Not all words should be stopwords
      const STOPLIST = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'it', 'this', 'that']);
      const allStop = words.every(w => STOPLIST.has(w));
      expect(allStop).toBe(false);
    }
  });

  it('respects minimum frequency threshold', () => {
    const entries = [
      'check for null values always',
      'use error handling properly in code',
      'use error handling properly in code',
      'use error handling properly in code',
    ];
    const metadata: PatternContext[] = entries.map((e, i) => ({
      agentName: 'Agent1',
      sessionId: `s-${i}`,
      timestamp: new Date(),
      snippet: e,
    }));

    const extractor = new PatternExtractor(3, 3);
    const patterns = extractor.extract(entries, metadata);

    // Only patterns appearing 3+ times should be returned
    for (const p of patterns) {
      expect(p.count).toBeGreaterThanOrEqual(3);
    }

    // "check for null values always" appears only once — should not be in results
    const singleUse = patterns.find(p => p.text.includes('check') && p.text.includes('null') && p.text.includes('values'));
    expect(singleUse).toBeUndefined();
  });
});
