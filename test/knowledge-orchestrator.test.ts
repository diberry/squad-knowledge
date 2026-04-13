import { describe, it, expect } from 'vitest';
import { KnowledgeOrchestrator } from '../src/orchestrator';
import { PatternContext, SkillCandidate } from '../src/types';

function makeEntries(phrase: string, count: number): { entries: string[]; metadata: PatternContext[] } {
  const entries: string[] = [];
  const metadata: PatternContext[] = [];
  for (let i = 0; i < count; i++) {
    entries.push(phrase);
    metadata.push({
      agentName: `Agent${i % 3}`,
      sessionId: `session-${i}`,
      timestamp: new Date(),
      snippet: phrase,
    });
  }
  return { entries, metadata };
}

describe('KnowledgeOrchestrator', () => {
  it('runs full candidate detection → approval → skill generation pipeline', async () => {
    const orchestrator = new KnowledgeOrchestrator();
    const { entries, metadata } = makeEntries('always check for null before accessing', 5);
    // Add more varied entries
    for (let i = 0; i < 5; i++) {
      entries.push('always check for null before accessing');
      metadata.push({ agentName: `Extra${i}`, sessionId: `extra-${i}`, timestamp: new Date(), snippet: 'always check for null before accessing' });
    }

    const state = await orchestrator.runFullPipeline(entries, metadata, [], (candidates) => candidates);

    expect(state.phase).toBe('complete');
    expect(state.candidates.length).toBeGreaterThan(0);
    expect(state.approvedSkills.length).toBeGreaterThan(0);
    expect(state.generatedFiles.length).toBeGreaterThan(0);

    // Verify generated files contain valid SKILL.md content
    for (const file of state.generatedFiles) {
      expect(file).toContain('---');
      expect(file).toContain('## Summary');
      expect(file).toContain('## Examples');
    }
  });

  it('detects and prevents duplicate skill creation', async () => {
    const orchestrator = new KnowledgeOrchestrator();

    const candidates: SkillCandidate[] = [
      {
        id: 'c1',
        title: 'Null Check Pattern',
        description: 'Check for null',
        patterns: [{ text: 'check for null', count: 5, contexts: [], frequency: 'medium' }],
        contexts: [{ agentName: 'A', sessionId: 's1', timestamp: new Date(), snippet: 'test' }],
        confidence: 'low',
        createdAt: new Date(),
      },
      {
        id: 'c2',
        title: 'Null Check Pattern Variant',
        description: 'Check for null variant',
        patterns: [{ text: 'check for null', count: 3, contexts: [], frequency: 'low' }],
        contexts: [{ agentName: 'B', sessionId: 's2', timestamp: new Date(), snippet: 'test' }],
        confidence: 'low',
        createdAt: new Date(),
      },
    ];

    const duplicates = await orchestrator.detectDuplicateCandidates(candidates);
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].length).toBe(2);
  });

  it('respects confidence thresholds in all operations', async () => {
    const orchestrator = new KnowledgeOrchestrator();
    const { entries, metadata } = makeEntries('validate input data always carefully', 5);

    const state = await orchestrator.runFullPipeline(entries, metadata);

    // All new skills should start at low confidence
    for (const skill of state.approvedSkills) {
      expect(skill.confidence).toBe('low');
    }
  });

  it('recovers from incomplete workflow', async () => {
    const orchestrator = new KnowledgeOrchestrator();

    // Save some candidates (simulating interrupted workflow)
    const candidates: SkillCandidate[] = [{
      id: 'c1',
      title: 'Saved Candidate',
      description: 'From interrupted workflow',
      patterns: [],
      contexts: [{ agentName: 'A', sessionId: 's', timestamp: new Date(), snippet: 'test' }],
      confidence: 'low',
      createdAt: new Date(),
      approvalStatus: 'pending',
    }];

    orchestrator.saveCandidates(candidates);

    const state = await orchestrator.recoverFromCheckpoint();
    expect(state.candidates).toHaveLength(1);
    expect(state.candidates[0].title).toBe('Saved Candidate');
  });
});
