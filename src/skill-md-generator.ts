import { SkillCandidate } from './types';

export class SkillMdGenerator {
  generate(candidate: SkillCandidate): string {
    const frontmatter = generateFrontmatter(candidate);
    const summary = `## Summary\n\n${candidate.description}\n`;
    const examples = formatSkillExamples(candidate);
    const content = `${frontmatter}\n${summary}\n${examples}\n`;

    const validation = this.validate(content);
    if (!validation.valid) {
      throw new Error(`Invalid SKILL.md: ${validation.errors.join(', ')}`);
    }

    return content;
  }

  validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content.startsWith('---')) {
      errors.push('Missing frontmatter opening');
    }
    if (!content.includes('title:')) {
      errors.push('Missing title in frontmatter');
    }
    if (!content.includes('confidence:')) {
      errors.push('Missing confidence in frontmatter');
    }
    if (!content.includes('## Summary')) {
      errors.push('Missing Summary section');
    }
    if (!content.includes('## Examples')) {
      errors.push('Missing Examples section');
    }

    return { valid: errors.length === 0, errors };
  }
}

export function generateFrontmatter(candidate: SkillCandidate): string {
  const agentNames = [...new Set(candidate.contexts.map(c => c.agentName))];
  const lines = [
    '---',
    `title: "${candidate.title}"`,
    `confidence: ${candidate.confidence}`,
    `created_at: ${candidate.createdAt.toISOString()}`,
    `agents: [${agentNames.map(a => `"${a}"`).join(', ')}]`,
    '---',
  ];
  return lines.join('\n');
}

export function formatSkillExamples(candidate: SkillCandidate): string {
  const lines = ['## Examples\n'];

  const agentGroups = new Map<string, string[]>();
  for (const ctx of candidate.contexts) {
    const snippets = agentGroups.get(ctx.agentName) || [];
    snippets.push(ctx.snippet);
    agentGroups.set(ctx.agentName, snippets);
  }

  for (const [agent, snippets] of agentGroups) {
    lines.push(`### Agent: ${agent}\n`);
    for (const snippet of snippets) {
      lines.push(`- ${snippet}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
