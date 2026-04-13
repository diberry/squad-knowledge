import { describe, it, expect } from 'vitest';
import { StalenessDetector, calculateStalenessScore } from '../src/staleness-detector';
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

describe('StalenessDetector', () => {
  it('marks knowledge as stale if not referenced in N sessions', () => {
    const detector = new StalenessDetector(20);

    // Referenced 10 sessions ago, current = 50 → 40 sessions gap → stale (>20)
    expect(detector.markStale('s1', 50, 10)).toBe(true);

    // Referenced 5 sessions ago, current = 15 → 10 sessions gap → not stale (≤20)
    expect(detector.markStale('s2', 15, 5)).toBe(false);
  });

  it('tracks reference count per skill', () => {
    const detector = new StalenessDetector(20);
    const skills = [makeSkill('x'), makeSkill('y')];

    const reuseData = new Map<string, { lastSession: number; count: number }>();
    reuseData.set('x', { lastSession: 45, count: 3 });
    reuseData.set('y', { lastSession: 10, count: 0 });

    const reports = detector.generateReport(skills, reuseData, 50);

    const reportX = reports.find(r => r.skillId === 'x')!;
    const reportY = reports.find(r => r.skillId === 'y')!;

    expect(reportX.reuseCount).toBe(3);
    expect(reportY.reuseCount).toBe(0);
  });

  it('flags deprecated skills in search results', () => {
    const detector = new StalenessDetector(20);
    const skills = [makeSkill('old-skill')];

    const reuseData = new Map<string, { lastSession: number; count: number }>();
    reuseData.set('old-skill', { lastSession: 0, count: 0 });

    const reports = detector.generateReport(skills, reuseData, 60);

    expect(reports[0].isStale).toBe(true);
    expect(reports[0].recommendedAction).toBe('deprecate');
  });

  it('suggests removal for skills unused for N sessions', () => {
    const detector = new StalenessDetector(20);

    // 55 sessions without use → should recommend deprecation
    expect(detector.recommendAction(55)).toBe('deprecate');

    // 25 sessions → review
    expect(detector.recommendAction(25)).toBe('review');

    // 10 sessions → keep
    expect(detector.recommendAction(10)).toBe('keep');
  });
});
