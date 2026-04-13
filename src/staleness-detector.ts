import { StalenessReport, ApprovedSkill } from './types';

export class StalenessDetector {
  private sessionWindow: number;

  constructor(sessionWindow = 20) {
    this.sessionWindow = sessionWindow;
  }

  markStale(skillId: string, currentSessionCount: number, lastReferencedSession: number): boolean {
    const sessionsSince = currentSessionCount - lastReferencedSession;
    return sessionsSince > this.sessionWindow;
  }

  detectUnused(skills: ApprovedSkill[], currentSession: number, reuseData: Map<string, { lastSession: number; count: number }>): StalenessReport[] {
    const reports: StalenessReport[] = [];

    for (const skill of skills) {
      const data = reuseData.get(skill.id) || { lastSession: 0, count: 0 };
      const sessionsSince = currentSession - data.lastSession;
      const isStale = sessionsSince > this.sessionWindow;

      reports.push({
        skillId: skill.id,
        lastReferencedSession: data.lastSession,
        sessionsSinceReference: sessionsSince,
        isStale,
        reuseCount: data.count,
        recommendedAction: this.recommendAction(sessionsSince),
      });
    }

    return reports;
  }

  generateReport(skills: ApprovedSkill[], reuseData: Map<string, { lastSession: number; count: number }>, currentSession = 50): StalenessReport[] {
    return this.detectUnused(skills, currentSession, reuseData);
  }

  recommendAction(sessionsStale: number): 'keep' | 'review' | 'deprecate' {
    if (sessionsStale > 50) return 'deprecate';
    if (sessionsStale > this.sessionWindow) return 'review';
    return 'keep';
  }
}

export function calculateStalenessScore(sessionsSinceReference: number, thresholdWindow: number): number {
  if (thresholdWindow <= 0) return 0;
  return Math.min(sessionsSinceReference / thresholdWindow, 1.0);
}
