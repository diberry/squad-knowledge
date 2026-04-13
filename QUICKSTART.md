# Squad Knowledge Operations — Quick Start Guide

Get up and running with pattern discovery, skill approval, and memory search in 5 minutes.

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later
- A `.squad/` directory with agent history files (optional for examples)

Verify your setup:

```bash
node --version    # Should be v18+
npm --version     # Should be 9+
```

## Installation & Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/bradygaster/project-squad-sdk-example-knowledge.git
cd project-squad-sdk-example-knowledge

# Install dependencies
npm install
```

Expected output:
```
added 120 packages, and audited 121 packages in 4.2s
```

### Step 2: Build TypeScript

```bash
npm run build
```

Expected output:
```
✓ TypeScript compiled successfully
dist/
  ├── types.d.ts
  ├── pattern-extractor.d.ts
  ├── skill-candidate-generator.d.ts
  ├── approval-queue.d.ts
  ├── ...
```

### Step 3: Run the Test Suite

```bash
npm run test
```

Expected output:
```
✓ test/pattern-extractor.test.ts (3 tests)
✓ test/skill-candidate-generator.test.ts (3 tests)
✓ test/approval-queue.test.ts (4 tests)
✓ test/skill-md-generator.test.ts (4 tests)
✓ test/confidence-tracker.test.ts (4 tests)
✓ test/memory-indexer.test.ts (4 tests)
✓ test/memory-search.test.ts (5 tests)
✓ test/staleness-detector.test.ts (4 tests)
✓ test/knowledge-orchestrator.test.ts (4 tests)
✓ test/cli.test.ts (4 tests)
✓ test/integration.test.ts (3 tests)
✓ test/edge-cases.test.ts (4 tests)

Test Files  12 passed (12)
Tests       48 passed (48)
```

## Walkthrough 1: Discover Your First Skill

Learn how to extract patterns from agent histories and approve a skill candidate.

### What You'll Do

1. Load agent history data
2. Extract repeated phrases (patterns)
3. Generate skill candidates
4. Approve a candidate
5. Generate SKILL.md

### Code Example

```typescript
import {
  PatternExtractor,
  SkillCandidateGenerator,
  ApprovalQueue,
  SkillMdGenerator,
} from 'project-squad-sdk-example-knowledge';
import { AgentsCollection } from '@bradygaster/squad-sdk';

// Step 1: Load agent history
const agentsCollection = new AgentsCollection(storageProvider);
const histories = await agentsCollection.loadAll();

// Step 2: Extract patterns from histories
const extractor = new PatternExtractor({
  minFrequency: 3,           // Pattern must appear 3+ times
  minPhraseLength: 2,        // At least 2 words
});

const patterns = await extractor.extractPatterns(histories);

console.log(`Found ${patterns.length} patterns:`);
patterns.slice(0, 3).forEach(p => {
  console.log(`  • "${p.text}" (${p.count} occurrences)`);
  console.log(`    Agents: ${p.contexts.map(c => c.agentName).join(', ')}`);
});

// Step 3: Generate candidates from patterns
const generator = new SkillCandidateGenerator(skillRegistry);
const candidates = await generator.generateCandidates(patterns);

console.log(`Generated ${candidates.length} skill candidates`);

// Step 4: Review and approve
const queue = new ApprovalQueue(storageProvider);
for (const candidate of candidates) {
  console.log(`\nCandidate: ${candidate.title}`);
  console.log(`Description: ${candidate.description}`);
  console.log(`Appeared in: ${candidate.contexts.length} sessions`);
  
  // Approve first candidate for this example
  if (candidates[0] === candidate) {
    await queue.approveCandidate(candidate.id);
    console.log('✓ Approved');
  }
}

// Step 5: Generate SKILL.md
const skillGenerator = new SkillMdGenerator();
const approved = await queue.getApprovedCandidates();
for (const skill of approved) {
  const skillMd = await skillGenerator.generateSkillMd(skill);
  console.log(`\nGenerated SKILL.md:\n${skillMd}`);
}
```

### Expected Output

```
Found 12 patterns:
  • "always check for null" (5 occurrences)
    Agents: alice, bob, charlie
  • "validate user input early" (4 occurrences)
    Agents: alice, diana
  • "use async/await for I/O" (3 occurrences)
    Agents: bob, charlie

Generated 5 skill candidates

Candidate: Always Check For Null
Description: Prevent runtime errors by checking for null before accessing properties
Appeared in: 5 sessions
✓ Approved

Generated SKILL.md:
---
title: Always Check For Null
confidence: low
created_at: 2024-01-15T10:30:00Z
agents: [alice, bob, charlie]
---

## Summary
Prevent runtime errors by checking for null before accessing properties.

## Examples
Demonstrated by: alice (5 sessions), bob (2 sessions), charlie (1 session)

...
```

## Walkthrough 2: Search Agent Memory

Find knowledge across team history with relevance ranking and attribution.

### What You'll Do

1. Build a searchable index of agent history and decisions
2. Search for a term
3. Review results with source attribution
4. Check for staleness

### Code Example

```typescript
import {
  MemoryIndexer,
  MemorySearch,
  StalenessDetector,
} from 'project-squad-sdk-example-knowledge';
import { 
  AgentsCollection,
  DecisionsCollection,
  LogCollection,
} from '@bradygaster/squad-sdk';

// Step 1: Build index
const agentsCollection = new AgentsCollection(storageProvider);
const decisionsCollection = new DecisionsCollection(storageProvider);
const logCollection = new LogCollection(storageProvider);

const indexer = new MemoryIndexer(
  agentsCollection,
  decisionsCollection
);
const index = await indexer.buildIndex();

console.log(`Indexed ${index.documents.length} documents`);
console.log(`Keywords: ${index.keywordIndex.size}`);
console.log(`Phrases: ${index.phraseIndex.size}`);

// Step 2: Search
const search = new MemorySearch(index);
const results = await search.search('error handling strategy', {
  maxResults: 5,
});

console.log(`\nFound ${results.length} results:\n`);

// Step 3: Review results
results.forEach((result, i) => {
  console.log(`${i + 1}. Relevance: ${(result.relevanceScore * 100).toFixed(0)}%`);
  console.log(`   From: ${result.document.sourceAgent} (${result.document.source})`);
  console.log(`   Date: ${result.document.timestamp.toISOString()}`);
  console.log(`   Matched: ${result.matchedTerms.join(', ')}`);
  
  if (result.isStale) {
    console.log(`   ⚠️  STALE: ${result.stalenessReason}`);
  }
  console.log(`   "${result.document.content.substring(0, 80)}..."\n`);
});

// Step 4: Check staleness
const detector = new StalenessDetector(logCollection);
const staleness = await detector.analyzeKnowledge();

console.log(`\nStaleness Report:`);
staleness.forEach(report => {
  if (report.isStale) {
    console.log(`⚠️  ${report.skillId}`);
    console.log(`   Last seen: ${report.sessionsSinceReference} sessions ago`);
    console.log(`   Recommendation: ${report.recommendedAction}`);
  }
});
```

### Expected Output

```
Indexed 247 documents
Keywords: 1,204
Phrases: 3,891

Found 3 results:

1. Relevance: 92%
   From: alice (agent_history)
   Date: 2024-01-14T15:32:00Z
   Matched: error, handling, strategy
   "Always use try-catch blocks around I/O operations. Log errors with full context..."

2. Relevance: 76%
   From: decisions (decisions)
   Date: 2024-01-12T09:15:00Z
   Matched: error, handling
   "Decision: Standardize error handling across microservices with custom error classes..."

3. Relevance: 61%
   From: bob (agent_history)
   Date: 2024-01-10T11:22:00Z
   Matched: strategy
   ⚠️  STALE: Not referenced in last 15 sessions
   "Consider wrapping third-party errors to provide consistent error interface..."

Staleness Report:
⚠️  "always validate user input"
   Last seen: 42 sessions ago
   Recommendation: review
```

## Walkthrough 3: Track Skill Confidence

Monitor how skills gain confidence through repeated use.

### What You'll Do

1. Create a new skill with "low" confidence
2. Track reuse across sessions
3. Observe confidence upgrade to "medium"
4. Review confidence report

### Code Example

```typescript
import {
  ConfidenceTracker,
  SkillMdGenerator,
} from 'project-squad-sdk-example-knowledge';
import { LogCollection } from '@bradygaster/squad-sdk';

// Step 1: Start with a new skill
const skill = {
  id: 'null-check-skill',
  title: 'Always Check For Null',
  description: 'Check for null before accessing',
  confidence: 'low',
  createdAt: new Date(),
  updatedAt: new Date(),
  agents: ['alice'],
  reuseCount: 0,
};

console.log(`Created skill: ${skill.title}`);
console.log(`Initial confidence: ${skill.confidence}`);

// Step 2: Track reuse by analyzing logs
const logCollection = new LogCollection(storageProvider);
const tracker = new ConfidenceTracker(logCollection);

const updatedSkill = await tracker.updateConfidenceFromLogs(skill);

console.log(`\nAfter analyzing logs:`);
console.log(`Reuse count: ${updatedSkill.reuseCount}`);
console.log(`New confidence: ${updatedSkill.confidence}`);

if (updatedSkill.confidence !== skill.confidence) {
  console.log(`✓ Upgraded from ${skill.confidence} to ${updatedSkill.confidence}`);
}

// Step 3: Get confidence report
const report = await tracker.getConfidenceReport([skill]);

console.log(`\nConfidence Report:`);
report.forEach(r => {
  console.log(`  ${r.skillId}`);
  console.log(`    Confidence: ${r.confidence}`);
  console.log(`    Reuse count: ${r.reuseCount}`);
  console.log(`    Last used: ${r.lastUsed}`);
});
```

### Expected Output

```
Created skill: Always Check For Null
Initial confidence: low

After analyzing logs:
Reuse count: 7
New confidence: medium
✓ Upgraded from low to medium

Confidence Report:
  null-check-skill
    Confidence: medium
    Reuse count: 7
    Last used: 2024-01-15T10:30:00Z
```

## Common Commands

### Run Tests in Watch Mode

For development, watch for file changes and rerun tests automatically:

```bash
npm run test:watch
```

Exit with `Ctrl+C`.

### Build Only (No Tests)

```bash
npm run build
```

### Run a Specific Test File

```bash
npm run test test/pattern-extractor.test.ts
```

### Check TypeScript for Errors

```bash
npx tsc --noEmit
```

## API Quick Reference

### PatternExtractor

```typescript
const extractor = new PatternExtractor({ minFrequency: 3 });
const patterns = await extractor.extractPatterns(histories);
// Returns: PatternMatch[] with text, count, contexts
```

### SkillCandidateGenerator

```typescript
const generator = new SkillCandidateGenerator(skillRegistry);
const candidates = await generator.generateCandidates(patterns);
// Returns: SkillCandidate[] with title, description, confidence
```

### ApprovalQueue

```typescript
const queue = new ApprovalQueue(storageProvider);
await queue.approveCandidate(candidateId);
await queue.rejectCandidate(candidateId, reason);
const approved = await queue.getApprovedCandidates();
```

### MemorySearch

```typescript
const search = new MemorySearch(index);
const results = await search.search(query, { maxResults: 10 });
// Returns: SearchResult[] with relevanceScore and attribution
```

### ConfidenceTracker

```typescript
const tracker = new ConfidenceTracker(logCollection);
const skill = await tracker.updateConfidenceFromLogs(skill);
const report = await tracker.getConfidenceReport([skill]);
```

### KnowledgeOrchestrator (End-to-End)

```typescript
const orchestrator = new KnowledgeOrchestrator(
  extractor,
  generator,
  queue,
  skillGenerator
);

const results = await orchestrator.runDiscoveryThroughApproval();
// Runs: extract → generate → deduplicate → approve → generate SKILL.md
```

## Troubleshooting

### `npm install` fails

Clear the npm cache and try again:

```bash
npm cache clean --force
npm install
```

### TypeScript errors on build

Check that TypeScript is properly installed:

```bash
npx tsc --version
npm run build
```

### Tests fail

Make sure all dependencies are installed:

```bash
npm install
npm run test
```

Run a specific test for more details:

```bash
npm run test test/pattern-extractor.test.ts
```

### Module not found errors

Verify the module is exported from `src/index.ts`:

```bash
cat src/index.ts
```

All major modules should be listed there.

## Next Steps

1. **Read the detailed plan**: `PLAN.md` contains the full 6-phase implementation roadmap
2. **Review the main README**: `README.md` has architecture diagrams, full API docs, and configuration options
3. **Explore source code**: See `src/` for implementation details
4. **Run examples**: Try the code walkthroughs above in your own scripts
5. **Write tests**: Add your own test cases to verify new features

## Getting Help

- Check `PLAN.md` for implementation details
- Review test files in `test/` for usage examples
- Look at type definitions in `src/types.ts` for API reference
- Read inline code comments for implementation notes

## Useful Resources

- [Squad SDK Documentation](https://github.com/bradygaster/squad-sdk)
- [README.md](./README.md) — Full project documentation
- [PLAN.md](./PLAN.md) — TDD implementation roadmap

Happy building! 🚀
