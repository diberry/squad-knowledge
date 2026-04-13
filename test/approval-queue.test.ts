import { describe, it, expect } from 'vitest';
import { ApprovalQueue } from '../src/approval-queue';
import { SkillCandidate } from '../src/types';

function makeCandidate(id: string, title: string): SkillCandidate {
  return {
    id,
    title,
    description: `Description for ${title}`,
    patterns: [],
    contexts: [{ agentName: 'Alice', sessionId: 's1', timestamp: new Date(), snippet: 'test' }],
    confidence: 'low',
    createdAt: new Date(),
    approvalStatus: 'pending',
  };
}

describe('ApprovalQueue', () => {
  it('loads pending candidates from storage', () => {
    const candidates = [
      makeCandidate('c1', 'Null Check'),
      makeCandidate('c2', 'Error Handling'),
      makeCandidate('c3', 'Input Validation'),
    ];

    const queue = new ApprovalQueue(candidates);
    const pending = queue.loadPendingCandidates();

    expect(pending).toHaveLength(3);
    pending.forEach(c => expect(c.approvalStatus).toBe('pending'));
  });

  it('marks candidate as approved', () => {
    const candidates = [makeCandidate('c1', 'Null Check')];
    const queue = new ApprovalQueue(candidates);

    queue.approveCandidate('c1');

    expect(queue.isApproved('c1')).toBe(true);
    expect(queue.getPendingCount()).toBe(0);
  });

  it('marks candidate as rejected', () => {
    const candidates = [makeCandidate('c1', 'Null Check')];
    const queue = new ApprovalQueue(candidates);

    queue.rejectCandidate('c1', 'Too vague');

    expect(queue.isApproved('c1')).toBe(false);
    const rejected = queue.getRejectedCandidates();
    expect(rejected).toHaveLength(1);
    expect(rejected[0].rejectionReason).toBe('Too vague');
  });

  it('moves approved candidate to skill generation queue', () => {
    const candidates = [
      makeCandidate('c1', 'Null Check'),
      makeCandidate('c2', 'Error Handling'),
    ];
    const queue = new ApprovalQueue(candidates);

    queue.approveCandidate('c1');

    expect(queue.getPendingCount()).toBe(1);
    const approved = queue.getApprovedCandidates();
    expect(approved).toHaveLength(1);
    expect(approved[0].id).toBe('c1');
  });
});
