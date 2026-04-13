import { SkillCandidate, SearchResult } from './types';
import { ApprovalQueue } from './approval-queue';
import { MemorySearchEngine } from './memory-search';
import { MemoryIndex } from './types';

export class CLIInterface {
  private approvalQueue: ApprovalQueue;
  private searchEngine: MemorySearchEngine;
  private memoryIndex: MemoryIndex | null = null;
  private output: string[] = [];

  constructor(approvalQueue?: ApprovalQueue, searchEngine?: MemorySearchEngine) {
    this.approvalQueue = approvalQueue || new ApprovalQueue();
    this.searchEngine = searchEngine || new MemorySearchEngine();
  }

  setMemoryIndex(index: MemoryIndex): void {
    this.memoryIndex = index;
  }

  listCandidates(): string[] {
    const candidates = this.approvalQueue.loadPendingCandidates();
    this.output = [];

    if (candidates.length === 0) {
      this.output.push('No pending candidates.');
      return this.output;
    }

    for (const c of candidates) {
      const agentNames = [...new Set(c.contexts.map(ctx => ctx.agentName))];
      this.output.push(
        `[${c.id.slice(0, 8)}] ${c.title} (confidence: ${c.confidence}) — agents: ${agentNames.join(', ')}`
      );
    }

    return this.output;
  }

  approveCandidate(candidateId: string): string {
    this.approvalQueue.approveCandidate(candidateId);
    return `✅ Candidate ${candidateId.slice(0, 8)} approved.`;
  }

  rejectCandidate(candidateId: string, reason: string): string {
    this.approvalQueue.rejectCandidate(candidateId, reason);
    return `❌ Candidate ${candidateId.slice(0, 8)} rejected: ${reason}`;
  }

  searchMemory(query: string): SearchResult[] {
    if (!this.memoryIndex) return [];
    return this.searchEngine.search(query, this.memoryIndex);
  }

  displayResults(results: SearchResult[]): string[] {
    this.output = [];

    if (results.length === 0) {
      this.output.push('No results found.');
      return this.output;
    }

    for (const r of results) {
      const source = r.document.sourceAgent || r.document.author;
      const snippet = r.document.content.slice(0, 80);
      this.output.push(
        `[${r.relevanceScore.toFixed(1)}] ${source}: "${snippet}..." (${r.document.timestamp.toISOString()})`
      );
    }

    return this.output;
  }

  getOutput(): string[] {
    return this.output;
  }
}

export async function runCLI(): Promise<void> {
  const cli = new CLIInterface();
  cli.listCandidates();
}
