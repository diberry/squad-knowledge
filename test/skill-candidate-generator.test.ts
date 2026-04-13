import { describe, it, expect } from 'vitest';
import { SkillCandidateGenerator, generateCandidateTitle, generateCandidateDescription } from '../src/skill-candidate-generator';
import { PatternMatch } from '../src/types';

function makePattern(text: string, count: number, agents: string[]): PatternMatch {
  return {
    text,
    count,
    frequency: count >= 10 ? 'high' : count >= 5 ? 'medium' : 'low',
    contexts: agents.map(a => ({
      agentName: a,
      sessionId: `session-${a}`,
      timestamp: new Date(),
      snippet: `Example of ${text} from ${a}`,
    })),
  };
}

describe('SkillCandidateGenerator', () => {
  it('generates candidates from pattern extractor output', () => {
    const patterns: PatternMatch[] = [
      makePattern('always check for null', 5, ['Alice', 'Bob']),
      makePattern('validate user input first', 4, ['Charlie']),
    ];

    const generator = new SkillCandidateGenerator();
    const candidates = generator.generateCandidates(patterns, []);

    expect(candidates).toHaveLength(2);
    expect(candidates[0].title).toBeTruthy();
    expect(candidates[0].description).toBeTruthy();
    expect(candidates[0].contexts.length).toBeGreaterThan(0);
    expect(candidates[1].title).toBeTruthy();
  });

  it('assigns low confidence to new candidates', () => {
    const patterns: PatternMatch[] = [
      makePattern('handle errors gracefully always', 3, ['Alice']),
    ];

    const generator = new SkillCandidateGenerator();
    const candidates = generator.generateCandidates(patterns, []);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].confidence).toBe('low');
  });

  it('deduplicates candidates against existing skills', () => {
    const patterns: PatternMatch[] = [
      makePattern('always check for null', 5, ['Alice']),
      makePattern('write unit tests first', 4, ['Bob']),
    ];

    const generator = new SkillCandidateGenerator();
    const candidates = generator.generateCandidates(patterns, ['check for null']);

    // The first pattern should be filtered as duplicate
    expect(candidates).toHaveLength(1);
    expect(candidates[0].title.toLowerCase()).toContain('unit tests');
  });
});
