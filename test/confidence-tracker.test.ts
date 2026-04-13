import { describe, it, expect } from 'vitest';
import { ConfidenceTracker, calculateConfidenceLevel } from '../src/confidence-tracker';
import { ApprovedSkill } from '../src/types';

function makeSkill(id: string): ApprovedSkill {
  return {
    id,
    title: `Skill ${id}`,
    description: 'Test skill',
    skillMdPath: `.squad/skills/${id}/SKILL.md`,
    confidence: 'low',
    reuseCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    agents: [],
  };
}

describe('ConfidenceTracker', () => {
  it('initializes new skills at low confidence', () => {
    const tracker = new ConfidenceTracker();
    const skill = makeSkill('s1');

    tracker.initializeSkill(skill);
    const metadata = tracker.getSkillMetadata('s1');

    expect(metadata).not.toBeNull();
    expect(metadata!.confidence).toBe('low');
    expect(metadata!.reuseCount).toBe(0);
  });

  it('bumps confidence to medium after independent reuse', () => {
    const tracker = new ConfidenceTracker();
    const skill = makeSkill('s1');
    tracker.initializeSkill(skill);

    // Track reuse by different agents (need 3+ times by 2+ agents for medium)
    tracker.trackReuse('s1', 'Alice');
    tracker.trackReuse('s1', 'Bob');
    tracker.trackReuse('s1', 'Alice');

    const metadata = tracker.getSkillMetadata('s1');
    expect(metadata!.confidence).toBe('medium');
    expect(metadata!.reuseCount).toBe(3);
  });

  it('tracks reuse count from SkillRegistry matches', () => {
    const tracker = new ConfidenceTracker();
    const skill = makeSkill('s1');
    tracker.initializeSkill(skill);

    for (let i = 0; i < 5; i++) {
      tracker.trackReuse('s1', `Agent${i}`);
    }

    const metadata = tracker.getSkillMetadata('s1');
    expect(metadata!.reuseCount).toBe(5);
  });

  it('resets reuse count on deprecation', () => {
    const tracker = new ConfidenceTracker();
    const skill = makeSkill('s1');
    tracker.initializeSkill(skill);

    tracker.trackReuse('s1', 'Alice');
    tracker.trackReuse('s1', 'Bob');
    tracker.trackReuse('s1', 'Charlie');

    tracker.resetOnDeprecation('s1');

    const metadata = tracker.getSkillMetadata('s1');
    expect(metadata!.reuseCount).toBe(0);
    // confidence stays as-is per PLAN: "reuse count = 0, confidence stays"
  });
});
