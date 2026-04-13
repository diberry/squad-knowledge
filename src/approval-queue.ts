import { SkillCandidate } from './types';

export class ApprovalQueue {
  private pendingCandidates: SkillCandidate[] = [];
  private approvedCandidates: SkillCandidate[] = [];

  constructor(initialCandidates?: SkillCandidate[]) {
    if (initialCandidates) {
      this.pendingCandidates = initialCandidates.map(c => ({ ...c, approvalStatus: c.approvalStatus || 'pending' as const }));
    }
  }

  loadPendingCandidates(): SkillCandidate[] {
    return this.pendingCandidates.filter(c => c.approvalStatus === 'pending');
  }

  loadFromStorage(data: SkillCandidate[]): void {
    this.pendingCandidates = data.map(c => ({ ...c }));
  }

  approveCandidate(id: string): void {
    const candidate = this.pendingCandidates.find(c => c.id === id);
    if (!candidate) throw new Error(`Candidate ${id} not found`);
    candidate.approvalStatus = 'approved';
    this.approvedCandidates.push(candidate);
  }

  rejectCandidate(id: string, reason: string): void {
    const candidate = this.pendingCandidates.find(c => c.id === id);
    if (!candidate) throw new Error(`Candidate ${id} not found`);
    candidate.approvalStatus = 'rejected';
    candidate.rejectionReason = reason;
  }

  isApproved(id: string): boolean {
    const candidate = this.pendingCandidates.find(c => c.id === id);
    return candidate?.approvalStatus === 'approved';
  }

  getPendingCount(): number {
    return this.pendingCandidates.filter(c => c.approvalStatus === 'pending').length;
  }

  getApprovedCandidates(): SkillCandidate[] {
    return this.approvedCandidates;
  }

  getRejectedCandidates(): SkillCandidate[] {
    return this.pendingCandidates.filter(c => c.approvalStatus === 'rejected');
  }

  getAllCandidates(): SkillCandidate[] {
    return [...this.pendingCandidates];
  }
}
