# Executive Summary: Squad SDK Knowledge Operations

## One-Liner
**Automatically discover, govern, and search patterns in AI agent team knowledge with Squad SDK.**

---

## The Problem

Teams using AI agents accumulate months of decision-making patterns and learned behaviors, but nobody writes them down — they remain trapped in history logs. When skills are created, there's no governance: they become stale, contradictory, or duplicate. The result: onboarding takes weeks, knowledge duplicates across agents, and teams can't answer "who knows about X?" without manual log reading.

---

## The Opportunity

Squad SDK provides direct access to agent histories, decisions, and skill registries — but teams have no automation layer to discover patterns, gate skill creation, or search memory. **Knowledge Operations** fills that gap: it transforms raw history into governed, searchable, reusable skills. This is the missing link between "agents accumulate patterns" and "patterns become team knowledge."

---

## Who Benefits

- **Tech Leads**: Codify team standards as skills without writing documentation. Confidence tracking ensures new skills prove themselves before broad deployment.
- **New Team Members (Human & AI)**: Answer "what should I do here?" by searching team memory with direct attribution — cut onboarding time by 40-50%.
- **Agents**: Reuse approved patterns injected into prompts. Staleness detection flags outdated advice before it's reinforced.
- **Project Managers**: Visibility into what knowledge the team has built and when it's becoming stale. Justification for skill investment.

---

## What You'll Learn

Building this project teaches you:
- **Discovery patterns**: How to extract repeated phrases from agent history and convert them to candidates
- **Governance at scale**: Approval workflows that gate automation (never auto-create skills)
- **Confidence tracking**: How to validate new patterns through reuse before trusting them team-wide
- **Search & attribution**: Full-text memory indexing with source tracking and staleness detection
- **End-to-end orchestration**: Coordinating multi-stage workflows (discovery → approval → generation → search)
- **Squad SDK integration**: Practical use of `AgentsCollection`, `DecisionsCollection`, `SkillRegistry`, and storage APIs

---

## Key Differentiator

**vs. Manual Documentation:**
- Patterns discovered automatically from history (not written by overloaded tech leads)
- Skills are attributed to agents who first demonstrated them (builds trust)
- Approval gate catches bad patterns before they spread (prevents anti-patterns)
- Search answers questions instantly (vs. reading docs or Slack history)

**vs. Auto-Generated Skills:**
- Every skill is human-approved before creation (no spam or contradictions)
- Confidence tracking prevents low-confidence skills from influencing agents
- Staleness detection surfaces outdated patterns before they calcify

---

## Build vs Buy

**Why build with Squad SDK:**
- **Off-the-shelf tools** (wikis, documentation systems) are write-once, read-never — patterns stay hidden in logs
- **Spreadsheet-based tracking** doesn't scale and requires manual updates
- **Squad SDK integration** lets skills directly influence agent prompts, closing the loop from discovery to deployment
- **Low cost**: Build once, reuse across all teams and agents running Squad
- **Competitive advantage**: No commercial product governs agent knowledge + memory this way

---

## ROI Signal

Measure success by these outcomes:

1. **Skill Adoption Rate**: >40% of auto-generated candidates approved by team. (Shows discovery is targeting real patterns, not noise.)
2. **Search Utility**: >70% of team memory searches return relevant results. <20% false positives. (Shows knowledge is findable.)
3. **Confidence Validation**: >60% of approved skills matched in subsequent agent spawns. (Shows skills are actually useful.)

---

## Next Steps

1. **Phase 1 (3-4 weeks)**: Implement pattern extraction, candidate generation, and approval workflow
2. **Phase 2 (2-3 weeks)**: Build SKILL.md generation and confidence tracking
3. **Phase 3 (Ongoing)**: Deploy memory search and integrate into agent prompts

See `PLAN.md` for TDD implementation roadmap and `QUICKSTART.md` for first-run guides.
