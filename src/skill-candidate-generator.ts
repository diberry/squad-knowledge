import { SkillCandidate, PatternMatch } from './types';
import { randomUUID } from 'node:crypto';

export class SkillCandidateGenerator {
  generateCandidates(patterns: PatternMatch[], existingSkillKeywords: string[]): SkillCandidate[] {
    const candidates: SkillCandidate[] = [];
    const normalizedExisting = existingSkillKeywords.map(k => k.toLowerCase());

    for (const pattern of patterns) {
      // Deduplicate: skip if pattern text matches an existing skill keyword
      if (this.isDuplicate(pattern.text, normalizedExisting)) continue;

      candidates.push({
        id: randomUUID(),
        title: generateCandidateTitle(pattern),
        description: generateCandidateDescription(pattern),
        patterns: [pattern],
        contexts: pattern.contexts,
        confidence: 'low',
        createdAt: new Date(),
        approvalStatus: 'pending',
      });
    }

    return candidates;
  }

  private isDuplicate(patternText: string, existingKeywords: string[]): boolean {
    const normalized = patternText.toLowerCase();
    return existingKeywords.some(keyword => {
      return normalized.includes(keyword) || keyword.includes(normalized);
    });
  }
}

export function generateCandidateTitle(pattern: PatternMatch): string {
  const words = pattern.text.split(' ');
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function generateCandidateDescription(pattern: PatternMatch): string {
  const agentNames = [...new Set(pattern.contexts.map(c => c.agentName))];
  return `Pattern observed ${pattern.count} times across agents: ${agentNames.join(', ')}. ` +
    `"${pattern.text}"`;
}
