# Squad SDK Knowledge Operations

**Skill Governance + Memory Search for AI Agent Teams**

Squad Knowledge Operations combines skill discovery, approval workflows, and intelligent memory search into a unified knowledge management system. It enables AI teams to automatically discover patterns from accumulated agent histories, review and approve new skills, track skill confidence through reuse, and search across team memory with attribution.

## Features

- **📊 Pattern Extraction**: Extract repeated phrases and patterns from agent histories with frequency analysis and noise filtering
- **🎯 Skill Candidate Generation**: Automatically generate skill candidates from discovered patterns with deduplication against existing skills
- **✅ Approval Workflow**: Review pending candidates with agent context and approval/rejection tracking
- **📝 SKILL.md Generation**: Auto-generate well-structured SKILL.md files with agent attribution and confidence tags
- **📈 Confidence Tracking**: Track skill usage across sessions and automatically upgrade confidence levels
- **🔍 Memory Search**: Full-text search across agent histories and decisions with relevance ranking and source attribution
- **⏱️ Staleness Detection**: Identify and flag outdated knowledge not referenced in recent sessions
- **🎭 End-to-End Orchestration**: Coordinate pattern discovery through approval and skill generation pipeline

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│          Squad SDK Knowledge Operations                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase 1: Discovery         Phase 2: Governance        │
│  ┌──────────────────┐      ┌──────────────────────┐   │
│  │ Pattern          │      │ SKILL.md             │   │
│  │ Extractor   ────┼────► │ Generator            │   │
│  └──────────────────┘      │                      │   │
│           │                │ Confidence Tracker   │   │
│           ▼                └──────────────────────┘   │
│  ┌──────────────────┐                 │               │
│  │ Skill Candidate  │      ┌──────────▼──────────┐   │
│  │ Generator   ────┼────► │ Approval Queue       │   │
│  └──────────────────┘      └──────────────────────┘   │
│                                                         │
│  Phase 3: Search            Phase 4: Orchestration    │
│  ┌──────────────────┐      ┌──────────────────────┐   │
│  │ Memory Indexer   │      │ Knowledge            │   │
│  │              ───┼────► │ Orchestrator    ────┐│   │
│  └──────────────────┘      │                    │└   │
│           │                └──────────────────────┘   │
│           ▼                                             │
│  ┌──────────────────┐                                  │
│  │ Memory Search    │                                  │
│  │ Staleness        │                                  │
│  │ Detector         │                                  │
│  └──────────────────┘                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## SDK Modules

| Module | Purpose | Status |
|--------|---------|--------|
| `PatternExtractor` | Extract n-grams and repeated phrases from histories | Implemented |
| `SkillCandidateGenerator` | Generate skill candidates from patterns with deduplication | Implemented |
| `ApprovalQueue` | Manage pending/approved candidate workflow | Implemented |
| `SkillMdGenerator` | Generate SKILL.md files with frontmatter and attribution | Implemented |
| `ConfidenceTracker` | Track skill reuse count and upgrade confidence levels | Implemented |
| `MemoryIndexer` | Index agent histories and decisions for search | Implemented |
| `MemorySearch` | Search indexed memory with relevance ranking | Implemented |
| `StalenessDetector` | Detect and flag outdated knowledge | Implemented |
| `KnowledgeOrchestrator` | Coordinate full discovery→approval→generation pipeline | Implemented |

## Project Structure

```
project-squad-sdk-example-knowledge/
├── README.md                    # This file
├── QUICKSTART.md               # Getting started guide
├── PLAN.md                     # Detailed implementation plan
├── package.json                # Project configuration
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── index.ts               # Main exports
│   ├── types.ts               # Core type definitions
│   ├── pattern-extractor.ts   # Pattern discovery from histories
│   ├── skill-candidate-generator.ts  # Generate candidates
│   ├── approval-queue.ts      # Manage candidate workflow
│   ├── skill-md-generator.ts  # Generate SKILL.md files
│   ├── confidence-tracker.ts  # Track skill confidence
│   ├── memory-indexer.ts      # Index agent memory
│   ├── memory-search.ts       # Search and rank results
│   ├── staleness-detector.ts  # Detect outdated knowledge
│   ├── orchestrator.ts        # End-to-end workflow
│   └── cli.ts                 # CLI interface
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

## Installation

### Prerequisites

- **Node.js** 18+ or later
- **npm** 9+

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd project-squad-sdk-example-knowledge

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Watch mode for development
npm run test:watch
```

## Configuration

The Knowledge Operations module is configured through initialization of each component:

```typescript
import {
  PatternExtractor,
  SkillCandidateGenerator,
  KnowledgeOrchestrator,
  MemorySearch,
} from 'project-squad-sdk-example-knowledge';
import { AgentsCollection, StorageProvider } from '@bradygaster/squad-sdk';

// Initialize with Squad SDK components
const agentsCollection = new AgentsCollection(storageProvider);
const patterns = new PatternExtractor();
const candidates = new SkillCandidateGenerator();
const orchestrator = new KnowledgeOrchestrator(
  patterns,
  candidates,
  storageProvider
);

// Run the full pipeline
await orchestrator.runDiscoveryThroughApproval();
```

### Configuration Options

- **Minimum Pattern Frequency** (default: 3): How many times a pattern must appear before extraction
- **Confidence Thresholds**: Upgrade skills to "medium" confidence after 3+ independent reuses
- **Staleness Window** (default: 20 sessions): Mark knowledge as stale if not referenced within window
- **Search Result Limit** (default: 10): Maximum search results returned per query

See individual module documentation for detailed configuration.

## How to Use

### Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for step-by-step guides:

1. **Discover Your First Skill** — Extract patterns from history files and approve a skill candidate
2. **Search Agent Memory** — Find knowledge across team history with attribution
3. **Track Skill Confidence** — Monitor skill reuse and confidence upgrades

### Example: Pattern Discovery and Skill Approval

```typescript
import { KnowledgeOrchestrator } from 'project-squad-sdk-example-knowledge';

// Run the full discovery pipeline
const results = await orchestrator.runDiscoveryThroughApproval();
console.log(`Found ${results.candidates.length} skill candidates`);

// Review and approve candidates
for (const candidate of results.candidates) {
  console.log(`Title: ${candidate.title}`);
  console.log(`Contexts: ${candidate.contexts.map(c => c.agentName).join(', ')}`);
  
  if (shouldApprove(candidate)) {
    await orchestrator.approveCandidate(candidate.id);
  }
}
```

### Example: Search Agent Memory

```typescript
import { MemoryIndexer, MemorySearch } from 'project-squad-sdk-example-knowledge';

// Index all agent history and decisions
const indexer = new MemoryIndexer(agentsCollection, decisionsCollection);
const index = await indexer.buildIndex();

// Search for knowledge
const search = new MemorySearch(index);
const results = await search.search('error handling patterns', { maxResults: 5 });

results.forEach(result => {
  console.log(`Found in ${result.document.sourceAgent}'s history`);
  console.log(`Relevance: ${result.relevanceScore}`);
  console.log(`Matched terms: ${result.matchedTerms.join(', ')}`);
});
```

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test test/pattern-extractor.test.ts
```

Test coverage includes:
- Unit tests for each module (pattern extraction, skill generation, search, etc.)
- Integration tests for full discovery→approval→generation pipeline
- Edge cases (empty histories, corrupted files, special characters)
- Performance tests (1000+ history entries)

## Development Workflow

1. **Make changes** to files in `src/`
2. **Run TypeScript compiler** to check for type errors: `npm run build`
3. **Write tests** for new features in `test/`
4. **Run tests** to verify: `npm run test`
5. **Review documentation** for needed updates

## API Documentation

Detailed type definitions are in `src/types.ts`:

- **`PatternMatch`** — Extracted phrase with frequency and context
- **`SkillCandidate`** — Generated candidate skill with metadata
- **`ApprovedSkill`** — Approved skill with SKILL.md path and tracking data
- **`MemoryDocument`** — Indexed document from history or decisions
- **`SearchResult`** — Search query result with ranking and attribution
- **`StalenessReport`** — Knowledge staleness analysis with recommendations

## Implementation Status

✅ **Implemented:**
- Pattern extraction from agent histories
- Skill candidate generation with deduplication
- Approval workflow management
- SKILL.md generation with agent attribution
- Confidence tracking through session logs
- Full-text memory indexing and search
- Staleness detection and reporting
- End-to-end orchestration pipeline
- Comprehensive test suite

⏳ **Future Work:**
- Semantic similarity for improved deduplication
- Auto-suggestion of conflicting patterns
- Skill quality scoring (specificity, actionability)
- Batch approval/rejection for large candidate sets
- Auto-deprecation based on staleness thresholds

## Related Resources

- [QUICKSTART.md](./QUICKSTART.md) — Step-by-step getting started guide
- [PLAN.md](./PLAN.md) — Detailed TDD implementation plan
- [@bradygaster/squad-sdk](https://github.com/bradygaster/squad-sdk) — Squad SDK documentation
- Squad Agent Collection docs — for agent history access

## License

See LICENSE file in repository root.
