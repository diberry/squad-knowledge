import { describe, it, expect } from 'vitest';
import { SkillMdGenerator, generateFrontmatter, formatSkillExamples } from '../src/skill-md-generator';
import { SkillCandidate } from '../src/types';

function makeCandidate(agents: string[]): SkillCandidate {
  return {
    id: 'test-id',
    title: 'Null Safety Check',
    description: 'Always check for null before accessing properties',
    patterns: [],
    contexts: agents.map(a => ({
      agentName: a,
      sessionId: `session-${a}`,
      timestamp: new Date(),
      snippet: `${a} demonstrated null checking pattern`,
    })),
    confidence: 'low',
    createdAt: new Date('2024-01-15T00:00:00Z'),
    approvalStatus: 'approved',
  };
}

describe('SkillMdGenerator', () => {
  it('generates SKILL.md with approved candidate data', () => {
    const generator = new SkillMdGenerator();
    const candidate = makeCandidate(['Alice']);
    const content = generator.generate(candidate);

    expect(content).toContain('---');
    expect(content).toContain('title:');
    expect(content).toContain('Null Safety Check');
    expect(content).toContain('## Summary');
    expect(content).toContain('## Examples');
  });

  it('includes agent attribution in skill examples', () => {
    const generator = new SkillMdGenerator();
    const candidate = makeCandidate(['Alice', 'Bob', 'Charlie']);
    const content = generator.generate(candidate);

    expect(content).toContain('Alice');
    expect(content).toContain('Bob');
    expect(content).toContain('Charlie');
    expect(content).toContain('### Agent: Alice');
    expect(content).toContain('### Agent: Bob');
    expect(content).toContain('### Agent: Charlie');
  });

  it('includes initial confidence tag (low)', () => {
    const generator = new SkillMdGenerator();
    const candidate = makeCandidate(['Alice']);
    const content = generator.generate(candidate);

    expect(content).toContain('confidence: low');
  });

  it('validates generated SKILL.md structure', () => {
    const generator = new SkillMdGenerator();
    const candidate = makeCandidate(['Alice']);
    const content = generator.generate(candidate);

    const result = generator.validate(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);

    // Validate that invalid content fails
    const invalid = generator.validate('This has no structure');
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });
});
