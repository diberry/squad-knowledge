import { describe, it, expect } from 'vitest';
import { CLIInterface } from '../src/cli';
import { ApprovalQueue } from '../src/approval-queue';
import { MemorySearchEngine } from '../src/memory-search';
import { MemoryIndexer } from '../src/memory-indexer';
import { SkillCandidate } from '../src/types';

function makeCandidate(id: string, title: string): SkillCandidate {
  return {
    id,
    title,
    description: `Description for ${title}`,
    patterns: [],
    contexts: [{ agentName: 'Alice', sessionId: 's1', timestamp: new Date(), snippet: `Example of ${title}` }],
    confidence: 'low',
    createdAt: new Date(),
    approvalStatus: 'pending',
  };
}

describe('CLIInterface', () => {
  it('lists pending candidates with score', () => {
    const queue = new ApprovalQueue([
      makeCandidate('c1', 'Null Check'),
      makeCandidate('c2', 'Error Handling'),
    ]);
    const cli = new CLIInterface(queue);

    const output = cli.listCandidates();

    expect(output).toHaveLength(2);
    expect(output[0]).toContain('Null Check');
    expect(output[0]).toContain('confidence: low');
    expect(output[0]).toContain('Alice');
    expect(output[1]).toContain('Error Handling');
  });

  it('approves candidate from CLI', () => {
    const queue = new ApprovalQueue([makeCandidate('c1', 'Null Check')]);
    const cli = new CLIInterface(queue);

    const result = cli.approveCandidate('c1');

    expect(result).toContain('approved');
    expect(queue.isApproved('c1')).toBe(true);
  });

  it('rejects candidate with reason', () => {
    const queue = new ApprovalQueue([makeCandidate('c1', 'Null Check')]);
    const cli = new CLIInterface(queue);

    const result = cli.rejectCandidate('c1', 'Too vague');

    expect(result).toContain('rejected');
    expect(result).toContain('Too vague');
  });

  it('shows search results with attribution', () => {
    const queue = new ApprovalQueue();
    const searchEngine = new MemorySearchEngine();
    const cli = new CLIInterface(queue, searchEngine);

    const indexer = new MemoryIndexer();
    const histories = new Map<string, string[]>();
    histories.set('Alice', ['always handle errors gracefully in production code']);
    const index = indexer.indexAgentHistories(histories);
    cli.setMemoryIndex(index);

    const results = cli.searchMemory('error');
    const display = cli.displayResults(results);

    expect(results.length).toBeGreaterThan(0);
    expect(display.length).toBeGreaterThan(0);
    // Display includes attribution from source agent
    const hasAlice = display.some(d => d.includes('Alice'));
    expect(hasAlice).toBe(true);
  });
});
