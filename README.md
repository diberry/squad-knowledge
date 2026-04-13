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
npm link          # makes "squad-knowledge" available globally
```

### CLI Commands

The `squad-knowledge` CLI has four commands:

| Command | Description |
|---------|-------------|
| `squad-knowledge discover <squad-dir>` | Scan agent histories and decisions, generate skill candidates |
| `squad-knowledge approve <candidate-id>` | Approve a candidate and generate its SKILL.md |
| `squad-knowledge search <query>` | Search across agent memory |
| `squad-knowledge status` | Show skill count, confidence levels, stale entries |

### Quick Demo with Sample Data

The repository ships with sample history files in `examples/.squad/`:

```bash
# 1. Discover patterns in the sample data
squad-knowledge discover examples/.squad

# 2. Check what was found
squad-knowledge status

# 3. Approve a candidate (use the ID from discover output)
squad-knowledge approve <candidate-id>

# 4. Search team memory
squad-knowledge search "null safety"
```

### Using Your Own Data

Point the CLI at any `.squad/` directory that contains:
- `agent-histories/*.txt` — one file per agent, one session per line
- `decisions/*.md` — team decision documents

```bash
squad-knowledge discover .squad
squad-knowledge status
squad-knowledge approve <candidate-id>
squad-knowledge search "error handling"
```

### Output

All outputs are:
- **SKILL.md files** in `.squad/skills/` with frontmatter and agent attribution
- **Search results** with relevance scores and source attribution
- **Staleness reports** flagging outdated patterns
- **candidates.json** and **memory-index.json** for state persistence

## Architecture

## Extending This Example

### Adding Custom Pattern Extractors

Extend the base pattern extractor to recognize domain-specific phrases:

```typescript
import { PatternExtractor } from 'project-squad-sdk-example-knowledge';
import type { PatternMatch, PatternContext } from 'project-squad-sdk-example-knowledge';

class DomainPatternExtractor extends PatternExtractor {
  extract(entries: string[], metadata: PatternContext[]): PatternMatch[] {
    // Run the standard n-gram extraction
    const standard = super.extract(entries, metadata);
    // Add domain-specific patterns
    const domain = this.findDomainPatterns(entries, metadata);
    return [...standard, ...domain];
  }

  private findDomainPatterns(entries: string[], metadata: PatternContext[]): PatternMatch[] {
    // Your custom extraction logic here (e.g., SQL queries, API calls)
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
import type { PatternContext } from 'project-squad-sdk-example-knowledge';

// Phase 1: Discovery
const extractor = new PatternExtractor(3, 3);  // minFrequency, minPhraseLength
const patterns = extractor.extract(entries, metadata);

// Phase 2: Generation
const generator = new SkillCandidateGenerator();
const candidates = generator.generateCandidates(patterns, existingSkillKeywords);

// Phase 3: Search
const indexer = new MemoryIndexer();
const index = indexer.indexAgentHistories(agentHistories);  // Map<string, string[]>
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
├── QUICKSTART.md                     # Setup guide
├── package.json                      # Dependencies, scripts, bin entry
├── tsconfig.json                     # TypeScript configuration
├── examples/
│   └── .squad/                       # Sample data for demo
│       ├── agent-histories/
│       │   ├── alice.txt
│       │   └── bob.txt
│       └── decisions/
│           └── 2024-01-error-strategy.md
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
│   ├── cli.ts                        # Programmatic CLI interface
│   └── cli/
│       └── main.ts                   # CLI entry point (bin)
└── test/
    └── *.test.ts                     # 48+ tests
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
