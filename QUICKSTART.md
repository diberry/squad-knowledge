# Squad Knowledge Operations — Quick Start

Configure and run pattern discovery, skill approval, and memory search with sample data in 10 minutes—zero code writing required.

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later

Verify your setup:

```bash
node --version    # v18+ required
npm --version     # 9+ required
```

## Setup

### Install and Build

```bash
# Clone the repository
git clone https://github.com/bradygaster/project-squad-sdk-example-knowledge.git
cd project-squad-sdk-example-knowledge

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run all tests (verify setup)
npm run test
```

Expected output:
```
Test Files  12 passed (12)
Tests       48 passed (48)
✓ Build complete
```

## Step 1: Create Sample History Files

Knowledge Operations needs agent history and decision files to discover patterns. Create the sample `.squad/` directory structure:

```bash
mkdir -p .squad/agent-histories .squad/decisions .squad/skills
```

### Create Alice's History

Save as `.squad/agent-histories/alice.txt`:

```
Session 001: Discussed null pointer errors. Always validate before property access.
Session 002: Code review caught an error. Always check for null pointers.
Session 003: Bug fix took two hours. The issue was null pointer dereference. Check null first.
Session 004: Validated user input at the beginning of the function.
Session 005: Performance optimization using async/await for database queries.
Session 006: Another null check prevented a crash in production.
Session 007: Implemented try-catch for error handling in API calls.
Session 008: Code style meeting. Emphasis on null safety patterns.
Session 009: Trainee mentoring session. Taught about null pointer safety.
Session 010: Updated linter rules to enforce null checking.
```

### Create Bob's History

Save as `.squad/agent-histories/bob.txt`:

```
Session 001: Began using async/await instead of callbacks.
Session 002: Tested null validation. Found several edge cases.
Session 003: Refactored database layer to use async/await.
Session 004: Discussed input validation strategy with team.
Session 005: Always check for null before property access. Critical lesson.
Session 006: Migrated promise chains to async/await for readability.
Session 007: Built validation middleware for all API endpoints.
Session 008: Improved error logging with full stack traces and context.
Session 009: Used async/await to simplify concurrent operations.
Session 010: Enforce null checks in code review process.
```

### Create Charlie's History

Save as `.squad/agent-histories/charlie.txt`:

```
Session 001: Error handling strategy review. Use custom error classes.
Session 002: Discussed null safety with the team.
Session 003: Implemented structured logging for errors.
Session 004: Always validate input early in the request pipeline.
Session 005: Performance improvement using async/await patterns.
Session 006: Null pointer checks are essential for robustness.
Session 007: Designed error handling framework for microservices.
Session 008: Code review focus: input validation and null checks.
Session 009: Async/await reduces callback complexity significantly.
Session 010: Weekly sync: error handling best practices.
```

### Create Team Decisions

Save as `.squad/decisions/2024-01-error-strategy.md`:

```markdown
# Team Decision: Error Handling Strategy

**Date:** 2024-01-15  
**Owner:** team-lead  
**Status:** Approved

## Summary

Establish standardized error handling across all services and agent code.

## Principles

Always wrap I/O operations in try-catch blocks. Log errors with full context including stack traces and request metadata.

Use custom error classes for domain-specific error types. Never swallow exceptions without logging.

Validate all user input at the boundary. Use async/await for all async operations.

Always check for null before accessing object properties. Prefer Optional chaining when available.

## Implementation

- Update linter configuration to enforce null checking
- Code review template includes error handling checklist
- Weekly sync to discuss patterns
```

## Step 2: Run Pattern Discovery

The Discovery phase extracts repeated phrases from agent histories:

```bash
# See what patterns can be discovered
node dist/cli.js discover .squad/agent-histories --minFrequency=3
```

**Expected output:**

```
Analyzing agent histories...

Found 12 patterns:

  1. "check for null" (9 occurrences, 3 agents)
  2. "async/await" (7 occurrences, 2 agents)
  3. "validate input" (6 occurrences, 2 agents)
  4. "error handling" (5 occurrences, 3 agents)
  5. "null pointer" (5 occurrences, 2 agents)
  6. "input validation" (4 occurrences, 2 agents)
  7. "try-catch" (3 occurrences, 2 agents)
  8. "logging" (3 occurrences, 2 agents)

Analysis complete.
```

## Step 3: Generate and Review Candidates

Skill candidates are generated from discovered patterns:

```bash
# Generate skill candidates from patterns
node dist/cli.js generate-candidates .squad/agent-histories --output=.squad/candidates.json

# List pending candidates for approval
node dist/cli.js list-candidates .squad/candidates.json
```

**Expected output:**

```
Generating skill candidates...

Generated 6 skill candidates:

[1a2b3c4d] Check For Null Before Access
  Confidence: low
  Appeared in: 9 sessions across 3 agents (alice, bob, charlie)
  Pattern: "check for null"

[2b3c4d5e] Use Async/Await For I/O
  Confidence: low
  Appeared in: 7 sessions across 2 agents (bob, charlie)
  Pattern: "async/await"

[3c4d5e6f] Validate Input Early
  Confidence: low
  Appeared in: 6 sessions across 2 agents (alice, bob)
  Pattern: "validate input"

[4d5e6f7g] Structured Error Handling
  Confidence: low
  Appeared in: 5 sessions across 3 agents (alice, bob, charlie)
  Pattern: "error handling"

[5e6f7g8h] Null Pointer Safety
  Confidence: low
  Appeared in: 5 sessions across 2 agents (alice, bob)
  Pattern: "null pointer"

[6f7g8h9i] Input Validation Strategy
  Confidence: low
  Appeared in: 4 sessions across 2 agents (bob, charlie)
  Pattern: "input validation"

Candidates ready for approval.
```

### Approve a Candidate

```bash
# Approve a single candidate
node dist/cli.js approve-candidate 1a2b3c4d .squad/candidates.json

# Then generate its SKILL.md file
node dist/cli.js generate-skill-md 1a2b3c4d .squad/candidates.json --output=.squad/skills/
```

**Expected output:**

```
✅ Candidate 1a2b3c4d approved.

Generating SKILL.md...

Created: .squad/skills/check-for-null-before-access.md

---
title: Check For Null Before Access
confidence: low
created_at: 2024-01-15T10:30:00Z
agents: [alice, bob, charlie]
---

## Summary

Always check for null before accessing object properties.

## Appears In

- alice (4 sessions)
- bob (3 sessions)
- charlie (2 sessions)

## Context

Pattern discovered through agent team history analysis.
```

### Reject a Candidate

```bash
# Reject a candidate with reason
node dist/cli.js reject-candidate 6f7g8h9i \
  "Too similar to Check For Null Before Access" \
  .squad/candidates.json
```

**Expected output:**

```
❌ Candidate 6f7g8h9i rejected.
Reason: Too similar to Check For Null Before Access
```

## Step 4: Search Team Memory

Index all history and decisions, then search with relevance ranking:

```bash
# Build the memory index
node dist/cli.js build-index .squad/ --output=.squad/memory-index.json

# Search the index
node dist/cli.js search-memory "null safety" .squad/memory-index.json --limit=5
```

**Expected output:**

```
Building memory index...

Indexed:
  - 10 agent history documents
  - 1 team decision document
  - Total: 11 documents

Running search: "null safety"

Found 5 results:

1. Relevance: 98%
   Source: alice (agent_history)
   Date: 2024-01-01
   Matched terms: null, safety, pointer
   "Always check for null pointers before property access..."

2. Relevance: 94%
   Source: bob (agent_history)
   Date: 2024-01-02
   Matched terms: null, check, pointer
   "Always validate null before accessing properties..."

3. Relevance: 89%
   Source: decisions (decision)
   Date: 2024-01-15
   Matched terms: null, checking
   "Always check for null before accessing object properties..."

4. Relevance: 76%
   Source: charlie (agent_history)
   Date: 2024-01-03
   Matched terms: safety, null
   ⚠️  STALE: Not referenced in last 15 sessions
   "Null pointer checks are essential for robustness..."

5. Relevance: 62%
   Source: alice (agent_history)
   Date: 2024-01-08
   Matched terms: pointer, errors
   "Discussed null pointer errors..."
```

### Search for Different Topics

```bash
# Search for error handling patterns
node dist/cli.js search-memory "error handling" .squad/memory-index.json

# Search for async patterns
node dist/cli.js search-memory "async/await performance" .squad/memory-index.json

# Search for validation strategies
node dist/cli.js search-memory "input validation" .squad/memory-index.json
```

## Full Workflow Summary

Run all steps together:

```bash
# 1. Discover patterns
node dist/cli.js discover .squad/agent-histories --minFrequency=3

# 2. Generate candidates
node dist/cli.js generate-candidates .squad/agent-histories --output=.squad/candidates.json

# 3. List candidates for review
node dist/cli.js list-candidates .squad/candidates.json

# 4. Approve a candidate
node dist/cli.js approve-candidate 1a2b3c4d .squad/candidates.json

# 5. Generate SKILL.md
node dist/cli.js generate-skill-md 1a2b3c4d .squad/candidates.json --output=.squad/skills/

# 6. Build memory index
node dist/cli.js build-index .squad/ --output=.squad/memory-index.json

# 7. Search memory
node dist/cli.js search-memory "your search query" .squad/memory-index.json
```

## Common Tasks

### List All Approved Skills

```bash
node dist/cli.js list-approved-skills .squad/skills/
```

### Track Skill Confidence

Monitor skill reuse and confidence upgrades:

```bash
# Track a skill being used
node dist/cli.js track-reuse check-for-null-before-access alice

# Check current confidence level
node dist/cli.js get-skill-confidence check-for-null-before-access

# Expected: "Reuse count: 4 → Confidence upgraded to: medium"
```

### Detect Stale Knowledge

Find patterns not referenced in recent sessions:

```bash
node dist/cli.js staleness-report .squad/ --window=20-sessions
```

Expected output:
```
Staleness Report:

⚠️  "input validation strategy"
   Last referenced: 42 sessions ago
   Status: STALE
   Recommendation: Review for deprecation

✓ "check for null before access"
   Last referenced: 2 sessions ago
   Status: ACTIVE
```

## Development & Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run specific test
npm run test test/pattern-extractor.test.ts
```

### Check TypeScript Compilation

```bash
npx tsc --noEmit
```

### Rebuild After Changes

```bash
npm run build
```

## Troubleshooting

### Missing .squad/ Directory

```bash
# Create required directory structure
mkdir -p .squad/agent-histories .squad/decisions .squad/skills
```

### "Cannot find module" Error

Rebuild TypeScript:
```bash
npm run build
```

### Tests Fail

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run test
```

### CLI Command Not Found

Verify build completed:
```bash
ls -la dist/cli.js
npm run build
```

## Next Steps

1. **Customize for your team** — Replace sample histories with real agent logs from `.squad/`
2. **Adjust thresholds** — Tune `--minFrequency`, staleness window, and search limits
3. **Extend extractors** — Add custom pattern extractors for domain-specific patterns
4. **Integrate with Squad** — Use programmatic API to integrate into Squad SDK projects
5. **Review the architecture** — See README.md for API documentation and design details

## Resources

- **README.md** — Architecture, modules, programmatic API, and integration guide
- **PLAN.md** — Detailed implementation roadmap and design decisions
- **src/types.ts** — Complete TypeScript type definitions
- **test/** — 48+ test cases showing usage patterns

Happy discovery! 🚀
