import { SkillCandidate } from './types';

export class ApprovalQueue {
  loadPendingCandidates(): SkillCandidate[] {
    // TODO: Load from .squad/pending-candidates.json
    return [];
  }

  approveCandidate(id: string): void {
    // TODO: Mark candidate as approved in storage
    // TODO: Move to approved queue
  }

  rejectCandidate(id: string, reason: string): void {
    // TODO: Mark candidate as rejected with reason
  }

  isApproved(id: string): boolean {
    // TODO: Check approval status
    return false;
  }

  getPendingCount(): number {
    // TODO: Return count of pending candidates
    return 0;
  }
}
