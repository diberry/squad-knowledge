# Squad Knowledge Operations — Quick Start

Run pattern discovery, skill approval, and memory search in 5 minutes using the CLI.

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later

```bash
node --version    # v18+ required
npm --version     # 9+ required
```

## Setup

```bash
git clone https://github.com/bradygaster/project-squad-sdk-example-knowledge.git
cd project-squad-sdk-example-knowledge
npm install
npm run build
npm link          # installs "squad-knowledge" globally
```

Verify:

```bash
squad-knowledge --help
```

## Step 1: Discover Patterns

The repository ships sample data in `examples/.squad/`. Run discovery against it:

```bash
squad-knowledge discover examples/.squad
```

This scans agent histories and decisions, extracts patterns, generates skill candidates, and builds a memory index. Output:

```
Scanning 20 history entries…

Found 12 patterns:
  • "check for null" (5 occurrences, 2 agents)
  • "async/await" (4 occurrences, 2 agents)
  …

Generated 6 skill candidates → examples/.squad/candidates.json
Memory index built → examples/.squad/memory-index.json (22 documents)
```

## Step 2: Check Status

```bash
squad-knowledge status
```

```
Knowledge Status
────────────────────────────────────────
  Candidates:  6 total
    Pending:   6
    Approved:  0
    Rejected:  0

Memory Index: 22 documents, updated 2024-01-15T10:30:00.000Z
```

## Step 3: Approve a Candidate

Copy a candidate ID from the discover output and approve it:

```bash
squad-knowledge approve <candidate-id>
```

```
✅ Candidate abc12345 approved.
   Generated examples/.squad/skills/check-for-null.md
```

## Step 4: Search Team Memory

```bash
squad-knowledge search "null safety"
```

```
Found 5 results:

  1. [score 8.0] alice (agent_history)
     "Session 001: Discussed null pointer errors. Always validate before property…"
     Matched: null, safety

  2. [score 6.0] bob (agent_history)
     "Session 005: Always check for null before property access. Critical lesson.…"
     Matched: null, check
```

## Using Your Own Data

Replace `examples/.squad/` with your real `.squad/` directory:

```bash
squad-knowledge discover .squad
squad-knowledge status
squad-knowledge approve <candidate-id>
squad-knowledge search "error handling"
```

### Required directory structure

```
.squad/
├── agent-histories/
│   ├── alice.txt       # one session per line
│   └── bob.txt
└── decisions/
    └── 2024-01-strategy.md
```

## Development & Testing

```bash
npm run test              # run all tests
npm run test:watch        # watch mode
npm run build             # rebuild TypeScript
```

## Next Steps

1. Replace sample data with real agent logs
2. Adjust pattern thresholds (edit `PatternExtractor` constructor args)
3. Add custom extractors — see README.md "Extending" section
4. Integrate with Squad SDK — see README.md "Programmatic API" section
