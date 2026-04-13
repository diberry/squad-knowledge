/**
 * Core types for Knowledge Operations
 */

export interface PatternMatch {
  text: string;
  count: number;
  contexts: PatternContext[];
  frequency: 'low' | 'medium' | 'high';
}

export interface PatternContext {
  agentName: string;
  sessionId: string;
  timestamp: Date;
  snippet: string;
}

export interface SkillCandidate {
  id: string;
  title: string;
  description: string;
  patterns: PatternMatch[];
  contexts: PatternContext[];
  confidence: 'low' | 'medium' | 'high';
  createdAt: Date;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface ApprovedSkill {
  id: string;
  title: string;
  description: string;
  skillMdPath: string;
  confidence: 'low' | 'medium' | 'high';
  reuseCount: number;
  createdAt: Date;
  updatedAt: Date;
  agents: string[];
}

export interface MemoryDocument {
  id: string;
  source: 'agent_history' | 'decisions' | 'logs';
  sourceAgent?: string;
  content: string;
  author: string;
  timestamp: Date;
  keywords: string[];
  phrases: string[];
}

export interface SearchResult {
  document: MemoryDocument;
  matchedTerms: string[];
  relevanceScore: number;
  isStale?: boolean;
  stalenessReason?: string;
}

export interface StalenessReport {
  skillId: string;
  lastReferencedSession: number;
  sessionsSinceReference: number;
  isStale: boolean;
  reuseCount: number;
  recommendedAction: 'keep' | 'review' | 'deprecate';
}

export interface MemoryIndex {
  documents: MemoryDocument[];
  keywordIndex: Map<string, MemoryDocument[]>;
  phraseIndex: Map<string, MemoryDocument[]>;
  lastUpdated: Date;
}
