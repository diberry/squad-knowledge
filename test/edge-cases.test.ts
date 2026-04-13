import { describe, it, expect } from 'vitest';
import { PatternExtractor } from '../src/pattern-extractor';
import { MemoryIndexer } from '../src/memory-indexer';
import { MemorySearchEngine } from '../src/memory-search';
import { SkillCandidateGenerator } from '../src/skill-candidate-generator';
import { SkillMdGenerator } from '../src/skill-md-generator';

describe('Edge Cases', () => {
  it('handles empty agent histories', () => {
    const extractor = new PatternExtractor();
    const patterns = extractor.extract([], []);
    expect(patterns).toHaveLength(0);

    const indexer = new MemoryIndexer();
    const index = indexer.indexAgentHistories(new Map());
    expect(index.documents).toHaveLength(0);
  });

  it('handles corrupted history files', () => {
    const indexer = new MemoryIndexer();
    const histories = new Map<string, string[]>();
    histories.set('Alice', ['Valid entry about coding']);
    histories.set('Bob', ['', '']); // empty entries
    histories.set('Charlie', ['Another valid entry']);

    const index = indexer.indexAgentHistories(histories);

    // Only valid non-empty entries should be indexed
    expect(index.documents.length).toBe(2);
  });

  it('handles skills with no contexts', () => {
    const generator = new SkillMdGenerator();
    const candidate = {
      id: 'empty-ctx',
      title: 'No Context Skill',
      description: 'A skill with no agent contexts',
      patterns: [],
      contexts: [],
      confidence: 'low' as const,
      createdAt: new Date('2024-01-01'),
      approvalStatus: 'approved' as const,
    };

    const content = generator.generate(candidate);
    expect(content).toContain('No Context Skill');
    expect(content).toContain('## Summary');
    expect(content).toContain('## Examples');
  });

  it('handles search queries with special characters', () => {
    const indexer = new MemoryIndexer();
    const histories = new Map<string, string[]>();
    histories.set('Alice', ['handle error codes like 404 and 500']);
    const index = indexer.indexAgentHistories(histories);

    const engine = new MemorySearchEngine();

    // Search with special chars should not crash
    const results1 = engine.search('error (404)', index);
    expect(Array.isArray(results1)).toBe(true);

    const results2 = engine.search('regex [a-z]+', index);
    expect(Array.isArray(results2)).toBe(true);

    const results3 = engine.search('', index);
    expect(Array.isArray(results3)).toBe(true);
  });

  it('handles very long pattern texts', () => {
    const longText = 'always validate the input data ' + 'thoroughly '.repeat(100) + 'before processing';
    const entries = [longText, longText, longText];
    const metadata = entries.map((e, i) => ({
      agentName: 'Alice',
      sessionId: `s-${i}`,
      timestamp: new Date(),
      snippet: e,
    }));

    const extractor = new PatternExtractor(3, 3);
    const patterns = extractor.extract(entries, metadata);

    // Should not crash; may or may not find patterns depending on n-gram limits
    expect(Array.isArray(patterns)).toBe(true);
  });
});
