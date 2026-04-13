# Squad Knowledge Operations

**Automated Skill Governance for AI Agent Teams**

Extract patterns from agent team histories, approve new skills, and search across team memory—all through a unified workflow. Knowledge Operations automatically discovers repeated best practices, manages skill approval, and enables full-text search with source attribution.

> **Note:** This project is a pattern example for Squad SDK skill governance. It does not import `@bradygaster/squad-sdk` at runtime—modules are standalone and designed for integration into Squad SDK projects.

## Using This Example

### Installation

```bash
git clone https://github.com/bradygaster/project-squad-sdk-example-knowledge.git
cd project-squad-sdk-example-knowledge
npm install
npm run build
```

### Pattern Discovery Workflow

Follow these **four configuration-first steps** with your own `.squad/` history and decision files:

#### Step 1: Prepare Sample History Files

Create a `.squad/` directory with sample agent history data:

```bash
mkdir -p .squad/agent-histories .squad/decisions
```

**`.squad/agent-histories/alice.txt`** — Agent Alice's history log:
```
Session 1: Check for null pointers before property access
Session 2: Always validate input early in the process
Session 3: Check for null pointers before property access
Session 4: Use async/await for I/O operations
Session 5: Check for null pointers before property access
```

**`.squad/agent-histories/bob.txt`** — Agent Bob's history log:
```
Session 1: Always validate input early in the process
Session 2: Use async/await for I/O operations
Session 3: Check for null pointers before property access
Session 4: Log errors with full context for debugging
Session 5: Prefer immutable data structures
```

**`.squad/decisions/2024-01-15-error-handling.md`** — Team decision log:
```markdown
# Decision: Error Handling Strategy

Date: 2024-01-15
Author: team-lead

Always wrap I/O operations in try-catch blocks.
Log errors with full context including stack traces.
Use custom error classes for domain-specific errors.
```

#### Step 2: Run Pattern Discovery

```bash
# Discover patterns in agent histories
node dist/pattern-extractor.js .squad/agent-histories

# Generate skill candidates from patterns
node dist/skill-candidate-generator.js .squad/agent-histories
```

**Expected output:**
```
Found 8 patterns:
  • "check for null pointers" (5 occurrences, 3 agents)
  • "validate input early" (4 occurrences, 2 agents)
  • "use async/await" (3 occurrences, 2 agents)

Generated 5 skill candidates
```

#### Step 3: Review and Approve Candidates

```bash
# List pending candidates for review
node dist/list-candidates.js

# Approve a skill candidate
node dist/approve-candidate.js <candidate-id>

# Reject a candidate with reason
node dist/reject-candidate.js <candidate-id> "Pattern too vague"
```

**Expected output:**
```
Pending Candidates:
[abc12345] Check For Null Pointers (confidence: low) — agents: alice, bob, charlie
[def67890] Validate Input Early (confidence: low) — agents: alice, bob
[ghi11111] Use Async/Await For I/O (confidence: low) — agents: bob, charlie

✅ Candidate abc12345 approved.
Generated SKILL.md at .squad/skills/check-for-null-pointers.md
```

#### Step 4: Search Team Memory

```bash
# Index all agent histories and decisions
node dist/build-memory-index.js .squad/

# Search across team memory
node dist/search-memory.js "error handling patterns"
```

**Expected output:**
```
Found 3 results:

1. Relevance: 92%
   Source: alice (agent_history) — 2024-01-14
   Matched: error, handling, patterns
   "Always wrap I/O operations in try-catch blocks..."

2. Relevance: 76%
   Source: decisions — 2024-01-12
   Matched: error, handling
   "Decision: Standardize error handling across services..."

3. Relevance: 61%
   Source: bob (agent_history) — 2024-01-10
   Matched: patterns
   ⚠️  STALE: Not referenced in last 15 sessions
   "Consider wrapping third-party errors..."
```

### Output — No Code Required

All outputs are:
- **SKILL.md files** in `.squad/skills/` with frontmatter and agent attribution
- **Search results** with relevance scores and source links
- **Staleness reports** flagging outdated patterns
- **Approval queue** tracking pending/approved candidates

No custom code or API imports needed to use the workflow.

## Architecture

## Extending This Example

### Adding Custom Pattern Extractors

Extend the base pattern extractor to recognize domain-specific phrases:

```typescript
import { PatternExtractor } from 'project-squad-sdk-example-knowledge';

class DomainPatternExtractor extends PatternExtractor {
  protected async preprocessText(text: string): Promise<string> {
    // Custom tokenization for your domain (e.g., SQL queries, API calls)
    return text.toLowerCase().replace(/my_domain_specific_pattern/g, 'DOMAIN_TOKEN');
  }

  async extractPatterns(histories: string[]) {
    const standard = await super.extractPatterns(histories);
    const domain = this.findDomainPatterns(histories);
    return [...standard, ...domain];
  }

  private findDomainPatterns(histories: string[]) {
    // Your custom extraction logic here
    return [];
  }
}
```

### Integrating with Real Squad State Files

Load actual `.squad/` history and decision files:

```typescript
import fs from 'fs/promises';
import { PatternExtractor, KnowledgeOrchestrator } from 'project-squad-sdk-example-knowledge';

async function loadSquadHistory(squadDir: string) {
  const historyDir = `${squadDir}/agent-histories`;
  const files = await fs.readdir(historyDir);
  
  const histories: string[] = [];
  for (const file of files) {
    if (file.endsWith('.txt')) {
      const content = await fs.readFile(`${historyDir}/${file}`, 'utf-8');
      histories.push(content);
    }
  }
  
  return histories;
}

// Then run the orchestrator
const histories = await loadSquadHistory('.squad');
const orchestrator = new KnowledgeOrchestrator();
const state = await orchestrator.runFullPipeline(histories);
```

### Programmatic API

Use Knowledge Operations components directly in your SDK integration:

```typescript
import {
  PatternExtractor,
  SkillCandidateGenerator,
  MemoryIndexer,
  MemorySearchEngine,
  KnowledgeOrchestrator,
} from 'project-squad-sdk-example-knowledge';

// Phase 1: Discovery
const extractor = new PatternExtractor({ minFrequency: 3 });
const patterns = await extractor.extractPatterns(histories);

// Phase 2: Generation
const generator = new SkillCandidateGenerator();
const candidates = await generator.generateCandidates(patterns);

// Phase 3: Search
const indexer = new MemoryIndexer();
const index = indexer.indexAgentHistories(agentHistories);
const search = new MemorySearchEngine();
const results = search.search('error handling', index, 10);

// Phase 4: Orchestration (all together)
const orchestrator = new KnowledgeOrchestrator();
const state = await orchestrator.runFullPipeline(entries, metadata);
```

## Project Structure

```
project-squad-sdk-example-knowledge/
├── README.md                         # This file
├── QUICKSTART.md                     # Configuration-first setup guide
├── PLAN.md                           # Implementation plan
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── src/
│   ├── index.ts                      # Main exports
│   ├── types.ts                      # Type definitions
│   ├── pattern-extractor.ts          # Pattern discovery
│   ├── skill-candidate-generator.ts  # Candidate generation
│   ├── approval-queue.ts             # Approval workflow
│   ├── skill-md-generator.ts         # SKILL.md generation
│   ├── confidence-tracker.ts         # Confidence tracking
│   ├── memory-indexer.ts             # Memory indexing
│   ├── memory-search.ts              # Search and ranking
│   ├── staleness-detector.ts         # Staleness detection
│   ├── orchestrator.ts               # End-to-end pipeline
│   └── cli.ts                        # CLI interface
└── test/
    ├── pattern-extractor.test.ts
    ├── skill-candidate-generator.test.ts
    ├── approval-queue.test.ts
    ├── skill-md-generator.test.ts
    ├── confidence-tracker.test.ts
    ├── memory-indexer.test.ts
    ├── memory-search.test.ts
    ├── staleness-detector.test.ts
    ├── knowledge-orchestrator.test.ts
    ├── cli.test.ts
    ├── integration.test.ts
    └── edge-cases.test.ts
```

## SDK Modules

| Module | Purpose |
|--------|---------|
| **PatternExtractor** | Extract n-grams and repeated phrases from team histories with configurable frequency thresholds |
| **SkillCandidateGenerator** | Generate skill candidates from discovered patterns with built-in deduplication against existing skills |
| **ApprovalQueue** | Manage pending/approved/rejected candidate workflow with persistent tracking |
| **SkillMdGenerator** | Auto-generate frontmatter-formatted SKILL.md files with agent attribution and confidence levels |
| **ConfidenceTracker** | Track skill reuse across agents and sessions; auto-upgrade confidence from low → medium → high |
| **MemoryIndexer** | Index agent histories and team decisions for full-text search with keyword extraction |
| **MemorySearchEngine** | Search indexed memory with TF-IDF relevance ranking and matched term highlighting |
| **StalenessDetector** | Identify and flag outdated patterns not referenced in recent sessions |
| **KnowledgeOrchestrator** | Coordinate the full discovery → generation → approval → search pipeline |

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run a specific test file
npm run test test/pattern-extractor.test.ts
```

**Test coverage includes:**
- Unit tests for each module (extraction, generation, search, approval)
- Integration tests for full discovery→approval→generation workflows
- Edge cases (empty histories, special characters, corrupted data)
- Performance tests (1000+ history entries)

## Roadmap

✅ **Implemented:**
- Pattern extraction with noise filtering and frequency analysis
- Skill candidate generation with deduplication
- Approval workflow management with tracking
- SKILL.md generation with frontmatter and attribution
- Confidence tracking through reuse counts
- Full-text memory indexing and search
- Staleness detection and reporting
- End-to-end orchestration pipeline
- Comprehensive test suite (48+ tests)

⏳ **Future:**
- Semantic similarity for improved deduplication
- Auto-suggestion of conflicting/similar patterns
- Skill quality scoring (specificity, actionability)
- Batch approval/rejection UI for large candidate sets
- Auto-deprecation based on staleness thresholds
- GraphQL API for SDK integration

## License

See LICENSE file in repository root.
