# Verdict→Action: AI-Powered Court Judgment Compliance Tracker

Verdict→Action is an AI-powered platform designed to transform dense legal judgments into structured, trackable, and enforceable compliance workflows. The system leverages large language models (LLMs) to automatically extract directives, assign responsibilities, track deadlines, detect statutory conflicts, and compute contempt-of-court risks in real time.

## Table of Contents
1. [Core Features](#core-features)
2. [Architecture & Technical Stack](#architecture--technical-stack)
3. [Database Schema](#database-schema)
4. [AI Extraction & Reasoning Engine](#ai-extraction--reasoning-engine)
5. [Contempt Risk Scoring System](#contempt-risk-scoring-system)
6. [Automated Escalation Workflow](#automated-escalation-workflow)
7. [Statutory Contradiction Detection](#statutory-contradiction-detection)

---

## Core Features

1. **Intelligent Extraction & Decomposition**  
   Automatically extracts actionable obligations from unstructured judgment text. Handles complex conditional directives (e.g., "if X fails, Z shall...") by decomposing them into explicit trigger conditions and actions.

2. **Side-by-Side Verification View**  
   A specialized UI that pairs the extracted action plan alongside the original source document. Clicking an extracted obligation automatically scrolls to and highlights the exact verbatim excerpt in the source text for seamless legal verification.

3. **Chain-of-Thought (CoT) Reasoning Traces**  
   Provides transparency into the AI's decision-making. Every extraction is accompanied by a step-by-step reasoning trace explaining *why* a party was identified, how a deadline was calculated, and how the obligation was classified.

4. **Real-Time Contempt Risk Scoring**  
   Calculates a dynamic 0–100 risk score for every judgment based on overdue obligations, compliance rates, priority levels, and historical delays, allowing leadership (e.g., Chief Secretary) to prioritize interventions.

5. **Multi-Tier Escalation Tracker**  
   Automates accountability through a structured 4-level escalation chain (Assigned Officer → Department Secretary → Chief Secretary → Advocate General's Office). Overdue obligations automatically escalate based on priority thresholds.

6. **Statutory Contradiction Detection**  
   Cross-references court directives against a built-in database of state/central laws to preemptively flag potential legal conflicts (e.g., a court order to demolish a structure conflicting with the Heritage Protection Act).

---

## Architecture & Technical Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** SQLite (for local/dev), Prisma ORM
- **AI Processing:** Extensible architecture designed to integrate with Legal-BERT or generic LLMs (currently implemented via advanced simulated logic with CoT formatting).

### Folder Structure
- `/app` — Next.js App Router pages and API routes
- `/components/ui` — Reusable shadcn UI components
- `/lib` — Core backend logic (`ai.ts`, `contempt-risk.ts`, `escalation.ts`, `statutory-check.ts`)
- `/prisma` — Database schema definition
- `/scripts` — Database seeding and initialization scripts

---

## Database Schema

The system uses Prisma to manage relational data. The core models include:

- **Judgment**: Stores metadata (title, case number, bench composition) and the full source text.
- **Party**: Entities involved in the case (Petitioner, Respondent, State).
- **Obligation**: The core actionable items extracted from the judgment. Contains fields for deadlines, priority, status, CoT reasoning, and trigger conditions.
- **ObligationUpdate**: An audit trail of manual status updates and evidence links.
- **EscalationEvent**: Records every time an obligation moves up the chain of command.
- **StatuteLaw**: A reference database of existing legal provisions.
- **StatutoryConflict**: Records detected contradictions between an `Obligation` and a `StatuteLaw`.

---

## AI Extraction & Reasoning Engine

Located in `lib/ai.ts`, the extraction engine processes raw judgment text. 

**Key Capabilities:**
1. **Conditional Parsing:** Uses pattern matching to identify "if/then" clauses within directives, splitting them into `triggerCondition` and `description`.
2. **Contextual Classification:** Classifies obligations into types (`DEADLINE_BOUND`, `CONTINUOUS`, `POLICY_CHANGE`, etc.) based on directive language.
3. **Chain of Thought Generation:** Constructs a JSON array representing the multi-step reasoning process (Source Identification → Party Attribution → Deadline Analysis → Classification → Verification Recommendation).

---

## Contempt Risk Scoring System

Located in `lib/contempt-risk.ts`.

The algorithm calculates a 0-100 score based on 5 weighted factors:
1. **Overdue Ratio (30%):** Percentage of active obligations that have missed their deadlines.
2. **Severity of Delay (25%):** Scales based on maximum days overdue (>7 days = 5 pts, >180 days = 25 pts).
3. **Non-Compliance Rate (20%):** Historical completion percentage for the judgment.
4. **High Priority Delays (15%):** Penalizes specifically for `CRITICAL` or `HIGH` priority items being late.
5. **Escalation Intensity (10%):** Points added based on how many times obligations have been escalated up the chain of command.

Scores map to predefined levels: `LOW` (<25), `MODERATE` (25-49), `HIGH` (50-74), and `CRITICAL` (75+).

---

## Automated Escalation Workflow

Located in `lib/escalation.ts`.

**Escalation Chain:**
1. Assigned Officer (Level 0)
2. Department Secretary (Level 1)
3. Chief Secretary (Level 2)
4. Advocate General's Office (Level 3)

**Auto-Escalation Logic:**
The system checks the days overdue against priority-based thresholds. For example, a `CRITICAL` obligation escalates to Level 1 after 3 days, Level 2 after 7 days, and Level 3 after 14 days. A `LOW` priority obligation waits 30 days before its first escalation.

---

## Statutory Contradiction Detection

Located in `lib/statutory-check.ts`.

Before execution, the system cross-references the `description` and `sourceExcerpt` of extracted obligations against the text of seeded `StatuteLaw` records.

**Detection Mechanism:**
1. **Keyword Overlap:** Checks for significant terminology overlap between the order and the law.
2. **Category Rule Engines:** Applies domain-specific rules (e.g., if a law is categorized as 'heritage', and the obligation contains 'demolish' or 'alter', a conflict is flagged).

Conflicts are categorized as either `POTENTIAL_OVERLAP` or `DIRECT_CONTRADICTION`, generating automated legal recommendations for the verifying officer.
