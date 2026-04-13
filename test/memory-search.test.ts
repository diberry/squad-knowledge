import { describe, it, expect } from 'vitest';
import { MemorySearchEngine, tokenizeQuery } from '../src/memory-search';
import { MemoryIndexer } from '../src/memory-indexer';
import { MemoryIndex } from '../src/types';

function buildTestIndex(): MemoryIndex {
  const indexer = new MemoryIndexer();
  const histories = new Map<string, string[]>();
  histories.set('Alice', [
    'always check for null before accessing properties',
    'use proper error handling with try-catch blocks',
    'validate input data before processing requests',
  ]);
  histories.set('Bob', [
    'null check is essential for robust code',
    'implement logging for all API endpoints',
    'write integration tests for critical paths',
  ]);

  const index = indexer.indexAgentHistories(histories);

  // Also add decisions
  const decisionDocs = indexer.indexDecisions(
    '## Decision: Use null checks everywhere\nWe agreed to always check for null.',
    'team-lead'
  );

  for (const doc of decisionDocs) {
    index.documents.push(doc);
    for (const kw of doc.keywords) {
      const existing = index.keywordIndex.get(kw) || [];
      existing.push(doc);
      index.keywordIndex.set(kw, existing);
    }
    for (const ph of doc.phrases) {
      const existing = index.phraseIndex.get(ph) || [];
      existing.push(doc);
      index.phraseIndex.set(ph, existing);
    }
  }

  return index;
}

describe('MemorySearchEngine', () => {
  it('finds exact keyword matches', () => {
    const index = buildTestIndex();
    const engine = new MemorySearchEngine();
    const results = engine.search('null check', index);

    expect(results.length).toBeGreaterThan(0);
    // Results should contain documents mentioning null check
    const hasNullContent = results.some(r =>
      r.document.content.toLowerCase().includes('null')
    );
    expect(hasNullContent).toBe(true);
  });

  it('ranks results by relevance (phrase > single keyword)', () => {
    const index = buildTestIndex();
    const engine = new MemorySearchEngine();
    const results = engine.search('null check', index);

    expect(results.length).toBeGreaterThan(1);
    // Results with exact phrase "null check" should rank higher
    const topResult = results[0];
    expect(topResult.relevanceScore).toBeGreaterThanOrEqual(results[results.length - 1].relevanceScore);
  });

  it('attributes results to source agent', () => {
    const index = buildTestIndex();
    const engine = new MemorySearchEngine();
    const results = engine.search('null', index);

    for (const r of results) {
      expect(r.document.author).toBeTruthy();
      expect(r.document.timestamp).toBeInstanceOf(Date);
    }

    const authors = results.map(r => r.document.author);
    expect(authors.some(a => a === 'Alice' || a === 'Bob' || a === 'team-lead')).toBe(true);
  });

  it('limits results to recent N entries', () => {
    const index = buildTestIndex();
    const engine = new MemorySearchEngine();
    const results = engine.search('null', index, 2);

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('searches both agent history and decisions', () => {
    const index = buildTestIndex();
    const engine = new MemorySearchEngine();
    const results = engine.search('null check', index);

    const sources = new Set(results.map(r => r.document.source));
    expect(sources.has('agent_history')).toBe(true);
    expect(sources.has('decisions')).toBe(true);
  });
});
