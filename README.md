# Squad SDK Knowledge Operations

A test-driven implementation of skill governance and memory search for the Squad SDK.

## Project Structure

- **`PLAN.md`** — Comprehensive TDD implementation plan with 6 phases, test-first descriptions, and phased dependencies
- **`src/`** — 12 source modules (scaffolded with TODO stubs)
  - Pattern extraction, candidate generation, approval queue
  - SKILL.md generation, confidence tracking
  - Memory indexing, search engine, staleness detection
  - CLI interface, orchestrator
- **`test/`** — 12 test suites + integration + edge cases
  - Tests named and organized per PLAN.md
  - Vitest + TypeScript setup ready

## Quick Start

```bash
# Install dependencies (when ready)
npm install

# Run tests (when tests are implemented)
npm test

# Build TypeScript
npm run build
```

## Implementation Phases

See **PLAN.md** for the full 6-phase roadmap:

1. **Phase 1**: Pattern extraction + candidate detection + deduplication
2. **Phase 2**: SKILL.md generation + confidence tracking
3. **Phase 3**: Memory indexing + search + staleness detection
4. **Phase 4**: CLI approval workflow
5. **Phase 5**: End-to-end orchestrator
6. **Phase 6**: Integration + edge case tests

Each phase lists tests first, then implementation steps needed to make them pass.

## Verified SDK Modules

| Module | Status |
|--------|--------|
| `skills.SkillRegistry` | ✅ Keyword matching |
| `skills.loadSkillsFromDirectory()` | ✅ Ready |
| `state.AgentsCollection` | ✅ History access |
| `state.DecisionsCollection` | ✅ Decisions access |
| `state.SkillsCollection` | ✅ Skills access |
| `state.LogCollection` | ✅ Logs access |
| `storage.StorageProvider` | ✅ Backend abstraction |

## Known Gaps

- NLP / semantic similarity (currently keyword-based)
- Conflict detection (contradictory patterns)
- Batch approval workflow
- Skill quality scoring

See PLAN.md for details.
