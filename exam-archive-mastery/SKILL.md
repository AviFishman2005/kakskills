---
name: exam-archive-mastery
description: >-
  Turn a course's archive of past exams and their solutions into a complete Hebrew exam-prep system:
  a per-exam methods analysis with the patterns behind the answers, one study page with exam / topic-study /
  statistics modes and visual diagrams, and a learning path that drills the student until they know the material
  (worked example → completion → hints → three correct alone, then spaced reviews to the exam date, interleaving,
  confidence ratings, auto-checked exercises with a mistake library), with progress synced to the user's account.
  Use whenever someone has past exams (מבחנים קודמים, בחינות לדוגמה, מחברות סרוקות, פתרונות) and wants to study
  for an exam: "תעבור על המבחנים ותסכם שיטות", "תבנה לי מסלול למידה למבחן", "סטטיסטיקות על המבחן", "מצב
  לימוד לפי נושאים", "תרגול עד שאני יודע את החומר", even if they don't name any of these modes. For Database
  Systems 20277 a finished build kit exists: use it instead of starting over.
---

# Exam archive → mastery

A student with an exam ahead usually has a pile of old exams and solutions: official answers, scanned notebooks
with grader marks, proposals of unknown quality. What they need is not another summary. They need to know
(1) how each kind of question is actually solved and graded, (2) what the exam really asks, how often and for how
many points, and (3) a way to practise until they can do it alone, on a schedule that makes it stick until the exam.

This skill builds that in stages. Each stage is useful on its own, and the user approves the expensive ones
before they are built. In the original session the user asked for exactly this order. Each request built on the
last:

1. **Methods analysis**: go through every exam systematically. Note the general method for each exam, then
   summarize the best methods by pattern.
2. **Study page**: keep that content as "exams mode", and add **study by topic** (focused on recent years) and
   **statistics**. It should look good and be clear and accessible.
3. **More depth in study mode**: explain what each formula means (e.g. what the canonical-cover definition
   says), add worked examples, and add visual diagrams wherever they help (ER above all).
4. **Targeted statistics** when asked (e.g. how often "dependency preserving" was the right answer).
5. **Learning path**: research effective learning tactics first, propose a creative plan, **get approval**, then
   build it in stages, with progress synced across devices.

Work out where the user is in this sequence and do the next step. Don't jump to stage 5 when they asked for stage 1.

## Fast path: Database Systems 20277 (Open University)

A finished system exists:

- **The page**: https://claude.ai/artifact/BCqaa5vbqfXyBYKD1Mawej (22 exams 1998–2024, four modes, 31 path skills).
  It declares `db` + `user`.
- **The private build kit** (all sources, exam data, banks, tests): https://claude.ai/artifact/87xmc1932ds7MNTNzUbi6F.
  Fetch files with the Artifact tool, `action: "read"`, `paths: [...]`. Recreate the folder layout and run
  `sh build/build.sh`. It writes `build/db-exams.html`, byte-identical to the published page.

For any change to the 20277 page (new exercises, a new unit, fixes, a newer exam), fetch the kit, edit, rerun
the tests in `build/tests/`, rebuild, and republish **to the same page URL** (read it first). Then update the kit
artifact with the changed sources. `references/course-20277.md` describes the kit, the course conventions and
the exam statistics. The kit holds exam text, so it stays in the private artifact. Never copy exam questions or
solutions into this public repo.

## Stage 1: methods analysis

- Read every exam and every solution yourself, one exam at a time, in chronological groups (old, sample, recent
  written, home exams). Scans: view the pages as images. Text extraction loses underlines (keys), arrows and math.
- For each exam write: the system it describes, every question with points, the **general method** that solves
  it, what the grader marked down (scanned notebooks are gold here), and anything in the official solution that
  is wrong. Say so, and fix it.
- End with the cross-exam synthesis: patterns by topic ("‘for every’ → division / double not exists", "a guard
  trigger is always before + return null"), recipes, traps and how the exam changed over the years.
- Deliver it as a **Doc** (Docs artifact type) unless the user asked for a file. It's long-lived reference.

## Stage 2: the study page

One self-contained Hebrew RTL HTML artifact with tabs (modes) and hash routing (`#exams`, `#study-<topic>`,
`#stats`, `#path`). Read `references/page-structure.md` before building. It holds the mode layouts, the Hebrew
bidi rules that caused most bugs, the component contracts and the screenshot checklist. In short:

- **Exams mode** is the stage-1 analysis, plus every item with the question, the full solution, "why it works"
  and the diagram. Item cards load on open.
- **Topic study** (recent years first). For each topic:
  - how to recognize it in the wording;
  - the recipe, step by step;
  - concept cards with **the formula and what each symbol means**, plus a small worked example;
  - worked examples whose steps unfold one at a time;
  - patterns, traps that cost points, flashcards, and real true/false statements;
  - all exam items for the topic.
- **Statistics**:
  - how often each topic appears, old vs. recent;
  - average points;
  - an exam × topic heatmap;
  - the distribution of answer directions (e.g. "not true" in 55% of ER statements; "lossless" yes 74% vs.
    "dependency preserving" yes 44%);
  - SQL idiom frequencies and trigger kinds.

  Compute every number in code from the extracted data. Say what was counted and how (versions, ambiguous items).
- **Diagrams** wherever they explain the mechanism: ER diagrams step by step, B+ trees and extendible hashing
  after each insertion, closure chips, division tables, the SQL evaluation pipeline, the trigger timeline.

## Stage 3: the learning path

**Research first, then propose, then wait.** Look up the evidence (sources in `references/learning-science.md`)
and present a concrete plan: the ladder, the schedule, the exercise types per topic, how answers are checked,
the limits, and the build stages. Ask the user for the decisions that change the build: approval, stages or all
at once, and local vs. cross-device progress. Build only after they answer.

The design that worked (details and code contracts in `references/path-engine.md`):

- **Ladder per skill**: worked example with one "why" question → two completions (backward fading) → solve with
  hints → three correct alone in a row. Multiple-choice skills skip the completion rung. An expert can skip ahead
  through an optional diagnostic.
- **Successive relearning**: a learned skill returns after 1, 3 and 7 days, compressed to fit the exam date.
  Each return needs one correct unaided answer. A failure drops the skill back to hints.
- **Interleaving**: mixed rounds across learned skills, plus "which pattern is this?" drills on real exam
  wording.
- **Calibration**: the student marks sure / think so / guessing before each check. The dashboard lists
  "sure but wrong" first.
- **Readiness** is weighted by each topic's average exam points. A skill counts fully only after two spaced
  reviews.

Exercise sources, in order of preference:

1. **Generators** for algorithmic topics (normalization, B+, hashing, estimation, algebra results), so every
   attempt is new. Calibrate them to exam-like answer distributions, not to what random generation produces.
2. **Real exam questions that execute** (SQL, relational algebra) on two seeded datasets per schema.
3. **Real solutions with one line blanked** (triggers), with distractors taken from documented grader
   deductions.
4. **Real true/false statements** on their diagrams (ER).

Every wrong answer should get an explanation of *its* mistake, not just "wrong". `references/checking.md` covers
how: a mistake library, mutation-tested datasets, and buggy-algorithm distractors.

**Progress sync**: declare `capabilities: {db: {}, user: {}}`. Keep the whole state in one private document,
`data/users/<id>/path`, with `localStorage` as an offline mirror and a manual backup code. Load the
`artifact-capabilities` skill before writing this code.

## Verification, every time

The user can't see your working directory and won't debug a broken study tool the night before an exam. Before
any publish:

- Run the generator self-checks: each generated problem's own solution passes its own checker, the answer
  distribution is reasonable, and there are no exceptions over 60+ seeds.
- Run mutation tests for executable exercises. The reference solution must pass on both datasets, and every
  known wrong variant must be rejected *and* matched to its explanation. Search seeds until that holds.
- Check generated algorithms against the answers of real exams, e.g. canonical covers, keys, and B+ trees vs.
  the course's own engine.
- Do a Playwright walkthrough of each skill through its full ladder, answering from the page's own solution
  objects. Then take screenshots at 1280 light and 390 dark, with horizontal overflow 0 and no console errors.
  `scripts/check_page.js` does the overflow, error and screenshot pass for any list of hash routes.
- Look at the screenshots yourself. Most bugs in this project were visual: bidi reversal, grid-laid-out
  feedback, tiny diagrams, a hero card that vanished after a re-render.

## Working with the user

- Reply in Hebrew, briefly: what changed and what was verified. Name limitations honestly, e.g. "free-form ER
  design isn't auto-checked", or "real account sync wasn't testable from here".
- When stats need judgment calls (multi-version home exams, an unclear solution), state the counting rule.
- Republish to the same artifact URL, so the user's link and progress stay.
- Offer the next stage in one line, and don't start it unasked.
