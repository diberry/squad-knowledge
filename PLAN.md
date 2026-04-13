# TDD Implementation Plan: Squad SDK Knowledge Operations

## Overview
Knowledge Operations combines skill governance (discovery → review → approval → deprecation) and memory search into one practical product. This plan structures every P0 feature as a test-first implementation.

---

## Verified SDK Modules

| Module | Provides | Gap |
|--------|----------|-----|
| `skills.SkillRegistry` | Register, match by keyword/role (0-1 score), load SKILL.md content | ⚠️ Simple keyword matching, not semantic discovery |
| `skills.loadSkillsFromDirectory()` | Load all skills from filesystem | ✅ Solid |
| `state.AgentsCollection` | Read agent history files | ✅ Solid (file access only — no pattern extraction) |
| `state.DecisionsCollection` | Read shared decisions | ✅ Solid |
| `state.SkillsCollection` | Typed access to `.squad/skills/` | ✅ Solid |
| `state.LogCollection` | Read session/orchestration logs | ✅ Solid |
| `storage.StorageProvider` | Read from any backend | ✅ Solid |

**Must Build:** Pattern extraction / NLP / topic detection, skill candidate generation, approval workflow, memory search indexing.

---

## Phase 1: Skill Candidate Detection & Deduplication

### 1.1 Pattern Extractor (Core NLP)
**Test:** `test/pattern-extractor.test.ts`
- **Test name:** "extracts repeated phrases from agent histories"
  - Input: Multiple agent history entries with repeated phrases (e.g., "always check for null before accessing")
  - Assert: Extractor returns patterns grouped by frequency and context
- **Test name:** "filters out noise patterns (single words, common articles)"
  - Input: Agent history with noise + signal
  - Assert: Patterns shorter than 3 words or in stoplist are excluded
- **Test name:** "respects minimum frequency threshold"
  - Input: Pattern appearing 1x, 2x, 3x in history
  - Assert: Only patterns ≥ threshold are returned (default threshold = 3)

**Implementation:**
- `src/pattern-extractor.ts`: Extract n-grams, frequency counts, context (agent name, session). Filter by length + stoplist. Return `PatternMatch[]` with `text`, `count`, `contexts[]`.

---

### 1.2 Skill Candidate Generator
**Test:** `test/skill-candidate-generator.test.ts`
- **Test name:** "generates candidates from pattern extractor output"
  - Input: `PatternMatch[]` from extractor
  - Assert: Candidates have title, description, contexts (which agents, how often)
- **Test name:** "assigns low confidence to new candidates"
  - Input: New candidates (never seen before)
  - Assert: All candidates have `confidence: 'low'`
- **Test name:** "deduplicates candidates against existing skills"
  - Input: Candidate matching existing skill keyword + new non-matching candidate
  - Assert: Duplicate excluded from output, new one included

**Implementation:**
- `src/skill-candidate-generator.ts`: Accept patterns + existing skills. Generate candidate title from pattern. Create description scaffolding. Filter duplicates using `SkillRegistry.match()`. Return `SkillCandidate[]`.

---

### 1.3 Approval Queue Manager
**Test:** `test/approval-queue.test.ts`
- **Test name:** "loads pending candidates from storage"
  - Input: `.squad/pending-candidates.json` with 3 candidates
  - Assert: Queue returns all 3, none marked approved
- **Test name:** "marks candidate as approved"
  - Input: Candidate A marked approved via `approveCandidate(id)`
  - Assert: Storage updated, `isApproved()` returns true
- **Test name:** "marks candidate as rejected"
  - Input: Candidate B marked rejected via `rejectCandidate(id, reason)`
  - Assert: Storage updated, candidate persists with rejection reason
- **Test name:** "moves approved candidate to skill generation queue"
  - Input: 2 pending, 1 approved
  - Assert: Approved candidate moved to `.squad/approved-skills.json`

**Implementation:**
- `src/approval-queue.ts`: Read/write `.squad/pending-candidates.json`. Maintain approval status and timestamps. Move approved to separate queue for SKILL.md generation.

---

## Phase 2: SKILL.md Generation & Confidence Tracking

### 2.1 SKILL.md Generator
**Test:** `test/skill-md-generator.test.ts`
- **Test name:** "generates SKILL.md with approved candidate data"
  - Input: Approved candidate with title, description, contexts
  - Assert: Output matches SKILL.md format (frontmatter, summary, examples)
- **Test name:** "includes agent attribution in skill examples"
  - Input: Candidate with 3 agent contexts (Alice, Bob, Charlie)
  - Assert: Generated SKILL.md lists agents who demonstrated this pattern
- **Test name:** "includes initial confidence tag (low)"
  - Input: Newly approved candidate
  - Assert: SKILL.md frontmatter has `confidence: low`
- **Test name:** "validates generated SKILL.md structure"
  - Input: Generated SKILL.md content
  - Assert: Required sections present, no syntax errors

**Implementation:**
- `src/skill-md-generator.ts`: Accept `ApprovedSkill`. Generate frontmatter (title, confidence, created_at, agents). Create summary from candidate description. Build examples section from pattern contexts. Return formatted string. Validate before returning.

---

### 2.2 Confidence Tracker
**Test:** `test/confidence-tracker.test.ts`
- **Test name:** "initializes new skills at low confidence"
  - Input: New skill from generator
  - Assert: Confidence = "low"
- **Test name:** "bumps confidence to medium after independent reuse"
  - Input: Skill matched and injected 3+ times by different agents
  - Assert: Confidence upgraded to "medium", updated_at refreshed
- **Test name:** "tracks reuse count from SkillRegistry matches"
  - Input: Skill matched 5 times in logs
  - Assert: Reuse count = 5
- **Test name:** "resets reuse count on deprecation"
  - Input: Skill manually marked deprecated
  - Assert: Reuse count = 0, confidence stays

**Implementation:**
- `src/confidence-tracker.ts`: Maintain skill metadata file (`.squad/skill-confidence.json`). Track reuse by querying logs/sessions for skill matches. Upgrade confidence on threshold. Persist metadata.

---

## Phase 3: Memory Search Indexing & Attribution

### 3.1 Memory Indexer
**Test:** `test/memory-indexer.test.ts`
- **Test name:** "indexes all agent history files into searchable structure"
  - Input: 3 agents with 5 history entries each
  - Assert: Index contains 15 documents, each with agent name + timestamp
- **Test name:** "indexes decision.md entries"
  - Input: `decisions.md` with 8 decision entries
  - Assert: Decisions indexed with author + date
- **Test name:** "creates keyword + phrase index for fast search"
  - Input: Text "always validate user input before parsing"
  - Assert: Index contains keywords [validate, user, input, parsing] + phrases [validate user, user input, input parsing]
- **Test name:** "handles missing/malformed entries gracefully"
  - Input: Corrupted history file + 2 valid ones
  - Assert: Valid entries indexed, corrupted logged as warning

**Implementation:**
- `src/memory-indexer.ts`: Read all history files + decisions. Build in-memory index (keywords + phrases). Store with metadata (source, author, timestamp). Return searchable `MemoryIndex`.

---

### 3.2 Memory Search Engine
**Test:** `test/memory-search.test.ts`
- **Test name:** "finds exact keyword matches"
  - Input: Query "null check", index contains that phrase
  - Assert: Returns matching document + context
- **Test name:** "ranks results by relevance (phrase > single keyword)"
  - Input: Query "null check", index has exact phrase + scattered keywords
  - Assert: Exact phrase result ranked first
- **Test name:** "attributes results to source agent"
  - Input: Search result from agent Alice's history
  - Assert: Result includes author="Alice", timestamp
- **Test name:** "limits results to recent N entries"
  - Input: Query with `maxResults=5`, 100 matches
  - Assert: Returns top 5 ranked results
- **Test name:** "searches both agent history and decisions"
  - Input: Query term in both agent history + decisions.md
  - Assert: Results from both sources, clearly attributed

**Implementation:**
- `src/memory-search.ts`: Accept query string + index. Tokenize query, search keywords + phrases. Rank by match quality. Attach source metadata (agent, timestamp). Return `SearchResult[]` sorted by relevance.

---

### 3.3 Staleness Detector
**Test:** `test/staleness-detector.test.ts`
- **Test name:** "marks knowledge as stale if not referenced in N sessions"
  - Input: Agent knowledge from 10 sessions ago, current session count = 50
  - Assert: Marked stale if not referenced in last 20 sessions (configurable window)
- **Test name:** "tracks reference count per skill"
  - Input: Skill X matched in 3 sessions, Y never matched
  - Assert: X count=3, Y count=0
- **Test name:** "flags deprecated skills in search results"
  - Input: Search returns skill marked deprecated
  - Assert: Result includes deprecation notice + reason
- **Test name:** "suggests removal for skills unused for N sessions"
  - Input: Skill not matched in 50+ sessions
  - Assert: Marked for review/potential deprecation

**Implementation:**
- `src/staleness-detector.ts`: Track skill matches from logs. Compare match count against session window. Flag entries/skills not seen recently. Return staleness report.

---

## Phase 4: Approval Workflow Integration

### 4.1 CLI Interface
**Test:** `test/cli.test.ts`
- **Test name:** "lists pending candidates with score"
  - Input: Run `knowledge review candidates`
  - Assert: CLI shows candidates, each with score + agent contexts
- **Test name:** "approves candidate from CLI"
  - Input: User selects candidate A, presses 'a' for approve
  - Assert: Candidate moved to approved queue, CLI confirms
- **Test name:** "rejects candidate with reason"
  - Input: User selects candidate B, presses 'r', enters reason
  - Assert: Rejection recorded with timestamp + reason
- **Test name:** "shows search results with attribution"
  - Input: Run `knowledge search "error handling"`
  - Assert: Results listed with agent name, context snippet, timestamp

**Implementation:**
- `src/cli.ts`: Prompt-based interface for candidate review. Integration with approval queue. Search command dispatcher. Output formatting.

---

## Phase 5: Integration & End-to-End

### 5.1 Knowledge Operations Orchestrator
**Test:** `test/knowledge-orchestrator.test.ts`
- **Test name:** "runs full candidate detection → approval → skill generation pipeline"
  - Input: 3 months of agent history
  - Assert: Extracts patterns → generates candidates → prompts for approval → creates SKILL.md files
- **Test name:** "detects and prevents duplicate skill creation"
  - Input: 2 candidates that describe same pattern
  - Assert: Only one approved/created
- **Test name:** "respects confidence thresholds in all operations"
  - Input: Skills with varying confidence levels
  - Assert: Only low+ confidence skills included in search/agent prompts
- **Test name:** "recovers from incomplete workflow"
  - Input: Run interrupted mid-approval
  - Assert: Restarts from last checkpoint (pending candidates preserved)

**Implementation:**
- `src/orchestrator.ts`: Coordinate all modules (extractor → generator → approval → SKILL.md → confidence tracking). Persist workflow state. Implement checkpoint recovery.

---

## Phase 6: Validation & Test Suite Completion

### 6.1 Integration Tests
**Test:** `test/integration.test.ts`
- **Test name:** "end-to-end: history → search → attribution"
- **Test name:** "end-to-end: pattern detection → approval → SKILL.md with confidence"
- **Test name:** "concurrent operations (multiple agents, multiple skills)"
- **Test name:** "large dataset performance (1000+ history entries)"

### 6.2 Edge Cases
**Test:** `test/edge-cases.test.ts`
- **Test name:** "handles empty agent histories"
- **Test name:** "handles corrupted history files"
- **Test name:** "handles skills with no contexts"
- **Test name:** "handles search queries with special characters"
- **Test name:** "handles very long pattern texts"

---

## Known Gaps & Future Work

1. **NLP / Semantic Similarity**: Current implementation uses keyword + phrase matching. No semantic understanding of "same pattern, different words."
2. **Auto-deduplication**: Candidates must be reviewed for duplication; semantic check would catch "null guard" vs "null check."
3. **Conflict Detection**: No detection of contradictory patterns (two agents learning opposite approaches).
4. **Skill Quality Scoring**: No metrics for specificity, actionability, or completeness.
5. **Batch Skill Approval**: No bulk approve/reject feature for large candidate sets.
6. **Deprecation Workflow**: Manual-only; could add auto-suggest based on staleness thresholds.

---

## Build Order & Milestones

| Phase | Milestones | Dependencies |
|-------|-----------|--------------|
| 1 | Pattern extraction, candidate generation, deduplication | None |
| 2 | SKILL.md generation, confidence tracking | Phase 1 complete |
| 3 | Memory indexing, search, staleness detection | Phase 1, 2 |
| 4 | CLI approval interface, skill publishing | Phase 1, 2, 3 |
| 5 | Orchestrator, end-to-end workflow | All phases |
| 6 | Integration tests, edge cases, validation | All phases |

---

## Expected Outcomes

✅ Teams can discover patterns from accumulated history without manual documentation.
✅ Approval gate ensures humans control skill creation.
✅ SKILL.md generation is automatic, consistent, and attributed.
✅ Search answers "who knows about X?" with timestamps and sources.
✅ Confidence tracking ensures new skills are validated before broad reuse.
✅ Staleness detection flags knowledge needing review or deprecation.
