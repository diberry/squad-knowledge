import { describe, it, expect } from 'vitest';
import { MemoryIndexer, tokenizeText } from '../src/memory-indexer';

describe('MemoryIndexer', () => {
  it('indexes all agent history files into searchable structure', () => {
    const histories = new Map<string, string[]>();
    histories.set('Alice', [
      'Always validate input before processing',
      'Check for null values in responses',
      'Use error boundaries in React components',
      'Document all public APIs thoroughly',
      'Write unit tests for edge cases',
    ]);
    histories.set('Bob', [
      'Prefer composition over inheritance',
      'Use TypeScript strict mode always',
      'Handle async errors with try-catch',
      'Log all API responses for debugging',
      'Review code before merging PRs',
    ]);
    histories.set('Charlie', [
      'Use semantic versioning for releases',
      'Keep functions small and focused',
      'Add retry logic for network calls',
      'Monitor memory usage in production',
      'Use feature flags for rollouts',
    ]);

    const indexer = new MemoryIndexer();
    const index = indexer.indexAgentHistories(histories);

    expect(index.documents).toHaveLength(15);
    for (const doc of index.documents) {
      expect(doc.author).toBeTruthy();
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.source).toBe('agent_history');
    }
  });

  it('indexes decision.md entries', () => {
    const decisions = `## Decision 1: Use TypeScript
We decided to use TypeScript for type safety.
---
## Decision 2: Use Vitest
Vitest is faster than Jest for our use case.
---
## Decision 3: REST over GraphQL
REST is simpler for our current needs.
---
## Decision 4: Use PostgreSQL
PostgreSQL handles our data model well.
---
## Decision 5: Deploy to Azure
Azure provides the best integration with our tools.
---
## Decision 6: Use ESLint
ESLint catches more issues than TSLint.
---
## Decision 7: Monorepo Structure
Monorepo keeps related packages together.
---
## Decision 8: CI with GitHub Actions
GitHub Actions integrates well with our workflow.`;

    const indexer = new MemoryIndexer();
    const docs = indexer.indexDecisions(decisions, 'team-lead');

    expect(docs.length).toBeGreaterThanOrEqual(8);
    for (const doc of docs) {
      expect(doc.author).toBe('team-lead');
      expect(doc.source).toBe('decisions');
    }
  });

  it('creates keyword + phrase index for fast search', () => {
    const histories = new Map<string, string[]>();
    histories.set('Alice', ['always validate user input before parsing']);

    const indexer = new MemoryIndexer();
    const index = indexer.indexAgentHistories(histories);

    // Check keywords indexed
    expect(index.keywordIndex.has('validate')).toBe(true);
    expect(index.keywordIndex.has('user')).toBe(true);
    expect(index.keywordIndex.has('input')).toBe(true);
    expect(index.keywordIndex.has('parsing')).toBe(true);

    // Check phrases indexed
    expect(index.phraseIndex.has('validate user')).toBe(true);
    expect(index.phraseIndex.has('user input')).toBe(true);
    expect(index.phraseIndex.has('input before')).toBe(true);
  });

  it('handles missing/malformed entries gracefully', () => {
    const histories = new Map<string, string[]>();
    histories.set('Alice', ['Valid entry about error handling']);
    histories.set('Bob', ['', 'Another valid entry about testing']);
    histories.set('Charlie', ['Good entry about deployment']);

    const indexer = new MemoryIndexer();
    const index = indexer.indexAgentHistories(histories);

    // Empty strings should be skipped, valid entries indexed
    expect(index.documents.length).toBe(3);
    for (const doc of index.documents) {
      expect(doc.content.length).toBeGreaterThan(0);
    }
  });
});
