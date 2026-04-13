import { describe, it, expect } from 'vitest';
import { PatternExtractor } from '../src/pattern-extractor';
import { SkillCandidateGenerator } from '../src/skill-candidate-generator';
import { ApprovalQueue } from '../src/approval-queue';
import { SkillMdGenerator } from '../src/skill-md-generator';
import { ConfidenceTracker } from '../src/confidence-tracker';
import { MemoryIndexer } from '../src/memory-indexer';
import { MemorySearchEngine } from '../src/memory-search';
import { PatternContext } from '../src/types';

describe('Integration Tests', () => {
  it('end-to-end: history → search → attribution', () => {
    const indexer = new MemoryIndexer();
    const histories = new Map<string, string[]>();
    histories.set('Alice', [
      'Always validate user input before processing',
      'Use error boundaries for React components',
    ]);
    histories.set('Bob', [
      'Validate all user input thoroughly',
      'Add retry logic for external API calls',
    ]);

    const index = indexer.indexAgentHistories(histories);
    const engine = new MemorySearchEngine();
    const results = engine.search('validate user input', index);

    expect(results.length).toBeGreaterThan(0);
    const authors = new Set(results.map(r => r.document.author));
    expect(authors.size).toBeGreaterThanOrEqual(1);
    // At least one result should be from Alice or Bob who both talk about validation
    expect(results.some(r => r.document.author === 'Alice' || r.document.author === 'Bob')).toBe(true);
  });

  it('end-to-end: pattern detection → approval → SKILL.md with confidence', () => {
    // Extract patterns
    const extractor = new PatternExtractor(3, 3);
    const entries: string[] = [];
    const metadata: PatternContext[] = [];
    for (let i = 0; i < 5; i++) {
      entries.push('always validate user input before processing');
      metadata.push({ agentName: `Agent${i}`, sessionId: `s-${i}`, timestamp: new Date(), snippet: 'validate input' });
    }

    const patterns = extractor.extract(entries, metadata);
    expect(patterns.length).toBeGreaterThan(0);

    // Generate candidates
    const generator = new SkillCandidateGenerator();
    const candidates = generator.generateCandidates(patterns, []);
    expect(candidates.length).toBeGreaterThan(0);

    // Approval
    const queue = new ApprovalQueue(candidates);
    queue.approveCandidate(candidates[0].id);
    expect(queue.isApproved(candidates[0].id)).toBe(true);

    // Generate SKILL.md
    const mdGenerator = new SkillMdGenerator();
    const approved = queue.getApprovedCandidates()[0];
    const content = mdGenerator.generate(approved);
    expect(content).toContain('confidence: low');
    expect(content).toContain('## Summary');

    // Track confidence
    const tracker = new ConfidenceTracker();
    tracker.initializeSkill({
      id: approved.id,
      title: approved.title,
      description: approved.description,
      skillMdPath: '.squad/skills/test/SKILL.md',
      confidence: 'low',
      reuseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      agents: [],
    });
    expect(tracker.getSkillMetadata(approved.id)!.confidence).toBe('low');
  });

  it('concurrent operations (multiple agents, multiple skills)', () => {
    const indexer = new MemoryIndexer();
    const histories = new Map<string, string[]>();

    // Simulate many agents
    for (let i = 0; i < 10; i++) {
      histories.set(`Agent${i}`, [
        `Agent${i} always checks for null values`,
        `Agent${i} uses error handling patterns`,
        `Agent${i} writes clean documentation`,
      ]);
    }

    const index = indexer.indexAgentHistories(histories);
    expect(index.documents).toHaveLength(30);

    const engine = new MemorySearchEngine();
    const results = engine.search('null', index);
    expect(results.length).toBeGreaterThan(0);

    // All results should have valid attribution
    for (const r of results) {
      expect(r.document.author).toMatch(/^Agent\d+$/);
    }
  });

  it('large dataset performance (1000+ history entries)', () => {
    const indexer = new MemoryIndexer();
    const histories = new Map<string, string[]>();

    // Generate 1000+ entries across agents
    for (let i = 0; i < 50; i++) {
      const agentEntries: string[] = [];
      for (let j = 0; j < 25; j++) {
        agentEntries.push(`Entry ${j} from agent ${i}: implement proper error handling and validation`);
      }
      histories.set(`Agent${i}`, agentEntries);
    }

    const start = Date.now();
    const index = indexer.indexAgentHistories(histories);
    const indexTime = Date.now() - start;

    expect(index.documents).toHaveLength(1250);

    const engine = new MemorySearchEngine();
    const searchStart = Date.now();
    const results = engine.search('error handling', index);
    const searchTime = Date.now() - searchStart;

    expect(results.length).toBeGreaterThan(0);
    // Performance: indexing + search should complete in reasonable time
    expect(indexTime).toBeLessThan(5000);
    expect(searchTime).toBeLessThan(2000);
  });
});
