import { SkillCandidate, ApprovedSkill, PatternContext } from './types';
import { PatternExtractor } from './pattern-extractor';
import { SkillCandidateGenerator } from './skill-candidate-generator';
import { ApprovalQueue } from './approval-queue';
import { SkillMdGenerator } from './skill-md-generator';
import { ConfidenceTracker } from './confidence-tracker';

export interface PipelineState {
  phase: 'extraction' | 'generation' | 'approval' | 'skill_creation' | 'complete';
  candidates: SkillCandidate[];
  approvedSkills: ApprovedSkill[];
  generatedFiles: string[];
}

export class KnowledgeOrchestrator {
  private state: PipelineState = {
    phase: 'extraction',
    candidates: [],
    approvedSkills: [],
    generatedFiles: [],
  };

  private extractor = new PatternExtractor();
  private generator = new SkillCandidateGenerator();
  private approvalQueue = new ApprovalQueue();
  private skillMdGenerator = new SkillMdGenerator();
  private confidenceTracker = new ConfidenceTracker();

  async runFullPipeline(
    entries: string[],
    metadata: PatternContext[],
    existingSkillKeywords: string[] = [],
    approvalFn: (candidates: SkillCandidate[]) => SkillCandidate[] = (c) => c
  ): Promise<PipelineState> {
    // Phase 1: Extract patterns
    this.state.phase = 'extraction';
    const patterns = this.extractor.extract(entries, metadata);

    // Phase 2: Generate candidates
    this.state.phase = 'generation';
    this.state.candidates = this.generator.generateCandidates(patterns, existingSkillKeywords);

    // Phase 3: Approval
    this.state.phase = 'approval';
    this.approvalQueue.loadFromStorage(this.state.candidates);
    const approved = approvalFn(this.state.candidates);
    for (const candidate of approved) {
      this.approvalQueue.approveCandidate(candidate.id);
    }

    // Phase 4: Generate SKILL.md files
    this.state.phase = 'skill_creation';
    for (const candidate of this.approvalQueue.getApprovedCandidates()) {
      const content = this.skillMdGenerator.generate(candidate);
      this.state.generatedFiles.push(content);

      const skill: ApprovedSkill = {
        id: candidate.id,
        title: candidate.title,
        description: candidate.description,
        skillMdPath: `.squad/skills/${candidate.id}/SKILL.md`,
        confidence: 'low',
        reuseCount: 0,
        createdAt: candidate.createdAt,
        updatedAt: new Date(),
        agents: [...new Set(candidate.contexts.map(c => c.agentName))],
      };

      this.confidenceTracker.initializeSkill(skill);
      this.state.approvedSkills.push(skill);
    }

    this.state.phase = 'complete';
    return this.state;
  }

  async detectDuplicateCandidates(candidates: SkillCandidate[]): Promise<SkillCandidate[][]> {
    const groups = new Map<string, SkillCandidate[]>();

    for (const candidate of candidates) {
      const key = candidate.patterns[0]?.text?.toLowerCase().split(' ').slice(0, 3).join(' ') || candidate.id;
      const group = groups.get(key) || [];
      group.push(candidate);
      groups.set(key, group);
    }

    return [...groups.values()].filter(g => g.length > 1);
  }

  async recoverFromCheckpoint(): Promise<PipelineState> {
    // Return current state - allows resuming from last saved phase
    return { ...this.state };
  }

  saveCandidates(candidates: SkillCandidate[]): void {
    this.state.candidates = candidates;
    this.approvalQueue.loadFromStorage(candidates);
  }

  saveApprovedSkills(skills: ApprovedSkill[]): void {
    this.state.approvedSkills = skills;
  }

  getState(): PipelineState {
    return { ...this.state };
  }
}
