import { SkillCandidate, PatternMatch } from './types';

export class SkillCandidateGenerator {
  generateCandidates(patterns: PatternMatch[], existingSkillKeywords: string[]): SkillCandidate[] {
    // TODO: Generate candidates from patterns
    // TODO: Assign low confidence to new candidates
    // TODO: Deduplicate against existing skills
    return [];
  }
}

export function generateCandidateTitle(pattern: PatternMatch): string {
  // TODO: Generate title from pattern text
  return '';
}

export function generateCandidateDescription(pattern: PatternMatch): string {
  // TODO: Generate description from pattern contexts
  return '';
}
