#!/usr/bin/env node

/**
 * squad-knowledge CLI — real argument parser for knowledge operations.
 *
 * Commands:
 *   discover <squad-dir>        Scan history/decisions, show skill candidates
 *   approve  <candidate-id>     Approve a candidate, generate SKILL.md
 *   search   <query>            Search agent memory
 *   status                      Show skill count, confidence levels, stale entries
 */

import fs from 'node:fs';
import path from 'node:path';
import { PatternExtractor } from '../pattern-extractor.js';
import { SkillCandidateGenerator } from '../skill-candidate-generator.js';
import { MemoryIndexer } from '../memory-indexer.js';
import { MemorySearchEngine } from '../memory-search.js';
import { ApprovalQueue } from '../approval-queue.js';
import { SkillMdGenerator } from '../skill-md-generator.js';
import { ConfidenceTracker } from '../confidence-tracker.js';
import { StalenessDetector } from '../staleness-detector.js';
import type { PatternContext, SkillCandidate, MemoryIndex } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function usage(): never {
  console.log(`Usage: squad-knowledge <command> [options]

Commands:
  discover <squad-dir>      Scan history & decisions, show skill candidates
  approve  <candidate-id>   Approve a candidate and generate SKILL.md
  search   <query>          Search agent memory
  status                    Show skill count, confidence levels, stale entries

Examples:
  squad-knowledge discover .squad
  squad-knowledge approve abc12345
  squad-knowledge search "null safety"
  squad-knowledge status
`);
  process.exit(0);
}

// Resolve the .squad directory; all state files live here.
let squadDir = '.squad';

function stateDir(): string {
  return squadDir;
}

function candidatesPath(): string {
  return path.join(stateDir(), 'candidates.json');
}

function indexPath(): string {
  return path.join(stateDir(), 'memory-index.json');
}

function skillsDir(): string {
  return path.join(stateDir(), 'skills');
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

function loadAgentHistories(dir: string): { entries: string[]; metadata: PatternContext[] } {
  const historiesDir = path.join(dir, 'agent-histories');
  if (!fs.existsSync(historiesDir)) fatal(`No agent-histories directory found at ${historiesDir}`);

  const files = fs.readdirSync(historiesDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
  const entries: string[] = [];
  const metadata: PatternContext[] = [];

  for (const file of files) {
    const agentName = path.basename(file, path.extname(file));
    const content = fs.readFileSync(path.join(historiesDir, file), 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      entries.push(line);
      metadata.push({ agentName, sessionId: file, timestamp: new Date(), snippet: line });
    }
  }

  return { entries, metadata };
}

function loadDecisions(dir: string): string[] {
  const decisionsDir = path.join(dir, 'decisions');
  if (!fs.existsSync(decisionsDir)) return [];

  const files = fs.readdirSync(decisionsDir).filter(f => f.endsWith('.md'));
  const contents: string[] = [];
  for (const file of files) {
    contents.push(fs.readFileSync(path.join(decisionsDir, file), 'utf-8'));
  }
  return contents;
}

function saveCandidates(candidates: SkillCandidate[]): void {
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(candidatesPath(), JSON.stringify(candidates, null, 2), 'utf-8');
}

function loadCandidates(): SkillCandidate[] {
  if (!fs.existsSync(candidatesPath())) return [];
  const raw = fs.readFileSync(candidatesPath(), 'utf-8');
  const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
  return parsed.map(c => ({
    ...c,
    createdAt: new Date(c.createdAt as string),
    contexts: (c.contexts as Array<Record<string, unknown>>).map(ctx => ({
      ...ctx,
      timestamp: new Date(ctx.timestamp as string),
    })),
  })) as unknown as SkillCandidate[];
}

function saveIndex(index: MemoryIndex): void {
  // Convert Maps to plain objects for JSON serialisation
  const serialisable = {
    documents: index.documents,
    keywordIndex: Object.fromEntries(
      Array.from(index.keywordIndex.entries()).map(([k, docs]) => [k, docs.map(d => d.id)]),
    ),
    phraseIndex: Object.fromEntries(
      Array.from(index.phraseIndex.entries()).map(([k, docs]) => [k, docs.map(d => d.id)]),
    ),
    lastUpdated: index.lastUpdated.toISOString(),
  };
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(indexPath(), JSON.stringify(serialisable, null, 2), 'utf-8');
}

function loadIndex(): MemoryIndex | null {
  if (!fs.existsSync(indexPath())) return null;
  const raw = JSON.parse(fs.readFileSync(indexPath(), 'utf-8'));
  const documents = raw.documents.map((d: Record<string, unknown>) => ({
    ...d,
    timestamp: new Date(d.timestamp as string),
  }));
  const docById = new Map(documents.map((d: { id: string }) => [d.id, d]));
  const keywordIndex = new Map<string, typeof documents>(
    Object.entries(raw.keywordIndex as Record<string, string[]>).map(([k, ids]) => [
      k,
      ids.map((id: string) => docById.get(id)).filter(Boolean),
    ]),
  );
  const phraseIndex = new Map<string, typeof documents>(
    Object.entries(raw.phraseIndex as Record<string, string[]>).map(([k, ids]) => [
      k,
      ids.map((id: string) => docById.get(id)).filter(Boolean),
    ]),
  );
  return { documents, keywordIndex, phraseIndex, lastUpdated: new Date(raw.lastUpdated) } as MemoryIndex;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdDiscover(dir: string): void {
  squadDir = dir;
  const { entries, metadata } = loadAgentHistories(dir);
  if (entries.length === 0) fatal('No agent history entries found.');

  console.log(`Scanning ${entries.length} history entries…\n`);

  // Extract patterns (use minFrequency=2 to catch patterns in smaller datasets)
  const extractor = new PatternExtractor(2);
  const patterns = extractor.extract(entries, metadata);
  console.log(`Found ${patterns.length} patterns:\n`);
  for (const p of patterns.slice(0, 20)) {
    const agents = [...new Set(p.contexts.map(c => c.agentName))];
    console.log(`  • "${p.text}" (${p.count} occurrences, ${agents.length} agents)`);
  }

  // Generate candidates
  const generator = new SkillCandidateGenerator();
  const candidates = generator.generateCandidates(patterns, []);
  saveCandidates(candidates);
  console.log(`\nGenerated ${candidates.length} skill candidates → ${candidatesPath()}`);

  // Build memory index
  const indexer = new MemoryIndexer();
  const agentHistories = new Map<string, string[]>();
  for (let i = 0; i < entries.length; i++) {
    const agent = metadata[i].agentName;
    const list = agentHistories.get(agent) || [];
    list.push(entries[i]);
    agentHistories.set(agent, list);
  }
  const index = indexer.indexAgentHistories(agentHistories);

  // Also index decisions
  const decisions = loadDecisions(dir);
  for (const content of decisions) {
    const docs = indexer.indexDecisions(content, 'team');
    index.documents.push(...docs);
    for (const doc of docs) {
      for (const kw of doc.keywords) {
        const list = index.keywordIndex.get(kw) || [];
        list.push(doc);
        index.keywordIndex.set(kw, list);
      }
      for (const ph of doc.phrases) {
        const list = index.phraseIndex.get(ph) || [];
        list.push(doc);
        index.phraseIndex.set(ph, list);
      }
    }
  }
  saveIndex(index);
  console.log(`Memory index built → ${indexPath()} (${index.documents.length} documents)`);
}

function cmdApprove(candidateId: string): void {
  const candidates = loadCandidates();
  if (candidates.length === 0) fatal('No candidates found. Run "discover" first.');

  // Match by prefix
  const match = candidates.find(c => c.id.startsWith(candidateId));
  if (!match) fatal(`Candidate "${candidateId}" not found.`);

  const queue = new ApprovalQueue(candidates);
  queue.approveCandidate(match.id);
  match.approvalStatus = 'approved';
  saveCandidates(candidates);

  // Generate SKILL.md
  const generator = new SkillMdGenerator();
  const content = generator.generate(match);
  const slug = match.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const outDir = skillsDir();
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.md`);
  fs.writeFileSync(outPath, content, 'utf-8');

  console.log(`✅ Candidate ${match.id.slice(0, 8)} approved.`);
  console.log(`   Generated ${outPath}`);
}

function cmdSearch(query: string): void {
  const index = loadIndex();
  if (!index) fatal('No memory index found. Run "discover" first.');

  const engine = new MemorySearchEngine();
  const results = engine.search(query, index, 10);

  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`Found ${results.length} results:\n`);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const source = r.document.sourceAgent || r.document.author;
    const snippet = r.document.content.slice(0, 100).replace(/\n/g, ' ');
    const stale = r.isStale ? ' ⚠️  STALE' : '';
    console.log(`  ${i + 1}. [score ${r.relevanceScore.toFixed(1)}] ${source} (${r.document.source})${stale}`);
    console.log(`     "${snippet}…"`);
    console.log(`     Matched: ${r.matchedTerms.join(', ')}\n`);
  }
}

function cmdStatus(): void {
  const candidates = loadCandidates();
  const pending = candidates.filter(c => c.approvalStatus === 'pending');
  const approved = candidates.filter(c => c.approvalStatus === 'approved');
  const rejected = candidates.filter(c => c.approvalStatus === 'rejected');

  console.log('Knowledge Status');
  console.log('─'.repeat(40));
  console.log(`  Candidates:  ${candidates.length} total`);
  console.log(`    Pending:   ${pending.length}`);
  console.log(`    Approved:  ${approved.length}`);
  console.log(`    Rejected:  ${rejected.length}`);

  if (approved.length > 0) {
    console.log('\nApproved Skills:');
    const tracker = new ConfidenceTracker();
    for (const c of approved) {
      const agents = [...new Set(c.contexts.map(ctx => ctx.agentName))];
      console.log(`  • ${c.title} (confidence: ${c.confidence}) — agents: ${agents.join(', ')}`);
    }
  }

  // Staleness check on approved skills
  if (approved.length > 0) {
    const detector = new StalenessDetector();
    const reuseData = new Map<string, { lastSession: number; count: number }>();
    for (const c of approved) {
      reuseData.set(c.id, { lastSession: 0, count: 0 });
    }
    const reports = detector.generateReport(
      approved.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        skillMdPath: '',
        confidence: c.confidence,
        reuseCount: 0,
        createdAt: c.createdAt,
        updatedAt: new Date(),
        agents: [...new Set(c.contexts.map(ctx => ctx.agentName))],
      })),
      reuseData,
    );
    const stale = reports.filter(r => r.isStale);
    if (stale.length > 0) {
      console.log(`\n⚠️  ${stale.length} stale skill(s) detected — run "discover" to refresh.`);
    }
  }

  const index = loadIndex();
  if (index) {
    console.log(`\nMemory Index: ${index.documents.length} documents, updated ${index.lastUpdated.toISOString()}`);
  } else {
    console.log('\nMemory Index: not built yet');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function main(argv: string[] = process.argv.slice(2)): void {
  // Support global --dir=<path> option
  const dirIdx = argv.findIndex(a => a.startsWith('--dir=') || a === '--dir');
  if (dirIdx !== -1) {
    if (argv[dirIdx].startsWith('--dir=')) {
      squadDir = argv[dirIdx].split('=')[1];
      argv.splice(dirIdx, 1);
    } else if (argv[dirIdx + 1]) {
      squadDir = argv[dirIdx + 1];
      argv.splice(dirIdx, 2);
    }
  }

  const command = argv[0];

  if (!command || command === '--help' || command === '-h') usage();

  switch (command) {
    case 'discover': {
      const dir = argv[1];
      if (!dir) fatal('Missing <squad-dir> argument. Example: squad-knowledge discover .squad');
      cmdDiscover(dir);
      break;
    }
    case 'approve': {
      const id = argv[1];
      if (!id) fatal('Missing <candidate-id> argument. Example: squad-knowledge approve abc12345');
      cmdApprove(id);
      break;
    }
    case 'search': {
      const query = argv.slice(1).join(' ');
      if (!query) fatal('Missing <query> argument. Example: squad-knowledge search "null safety"');
      cmdSearch(query);
      break;
    }
    case 'status':
      cmdStatus();
      break;
    default:
      fatal(`Unknown command: ${command}\n\nRun "squad-knowledge --help" for usage.`);
  }
}

main();
