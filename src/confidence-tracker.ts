import { ApprovedSkill } from './types';

export class ConfidenceTracker {
  private skills: Map<string, ApprovedSkill> = new Map();
  private reuseAgents: Map<string, Set<string>> = new Map();

  initializeSkill(skill: ApprovedSkill): void {
    skill.confidence = 'low';
    skill.reuseCount = 0;
    skill.updatedAt = new Date();
    this.skills.set(skill.id, { ...skill });
    this.reuseAgents.set(skill.id, new Set());
  }

  trackReuse(skillId: string, agentName: string): void {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);

    skill.reuseCount++;
    skill.updatedAt = new Date();

    const agents = this.reuseAgents.get(skillId) || new Set();
    agents.add(agentName);
    this.reuseAgents.set(skillId, agents);

    skill.confidence = calculateConfidenceLevel(skill.reuseCount, agents.size);
    this.skills.set(skillId, { ...skill });
  }

  updateConfidence(skillId: string, reuseCount: number): void {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);

    const agents = this.reuseAgents.get(skillId) || new Set();
    skill.confidence = calculateConfidenceLevel(reuseCount, agents.size);
    skill.updatedAt = new Date();
    this.skills.set(skillId, { ...skill });
  }

  getSkillMetadata(skillId: string): ApprovedSkill | null {
    return this.skills.get(skillId) || null;
  }

  resetOnDeprecation(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);

    skill.reuseCount = 0;
    skill.updatedAt = new Date();
    this.skills.set(skillId, { ...skill });
    this.reuseAgents.set(skillId, new Set());
  }
}

export function calculateConfidenceLevel(reuseCount: number, uniqueAgents = 1): 'low' | 'medium' | 'high' {
  if (reuseCount >= 10 && uniqueAgents >= 3) return 'high';
  if (reuseCount >= 3 && uniqueAgents >= 2) return 'medium';
  return 'low';
}
