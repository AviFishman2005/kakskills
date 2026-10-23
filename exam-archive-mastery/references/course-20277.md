# Database Systems 20277: the finished build

- **Page**: https://claude.ai/artifact/BCqaa5vbqfXyBYKD1Mawej (capabilities `db` + `user`; progress lives at
  `data/users/<id>/path`).
- **Private kit**: https://claude.ai/artifact/87xmc1932ds7MNTNzUbi6F. Exam text lives there and never in this
  repo.
- **Original course page** (the source the items were extracted from, with its SQL, RA, B+ and ER engines): the
  user's earlier course artifact. You only need it to re-extract items (`build/extract2.py <page.html>`);
  `build/exams2.json` already holds the result.

## Kit layout

| Path | What |
|---|---|
| `doc.md` | Stage-1 analysis: method per exam, then patterns. Source of exams mode. |
| `build/exams2.json` | 22 exams × items: question, answer, why, quiz statements, category, points, diagram placeholders. |
| `build/template.html` | CSS and JS for all four modes. |
| `build/build.py` | Assembles: doc → sections, exam data, statistics, ER statement data, then injects everything. |
| `build/topics.py`, `topics_extra.py`, `viz_topics.py` | Topic study content: recipes, concepts with formula meanings, worked examples, and the diagrams attached to them. Run in this order (from `build/`). |
| `build/viz_orig.js`, `viz_glue.js` | Diagram engines (ER_SPECS of every exam diagram, ERX, BPT, EXH, SVG renderers) and the mounting glue. |
| `build/path/sql_engine.js` | SQL engine with predicate pushdown. `sql_rules_raw.js` holds the allowed-operations checker. |
| `build/path/sqlbank.js` | 11 exam schemas with seeded generators, 32 exercises (4 idioms), fades, hints, wrong variants. `sql_seeds.json` holds the searched seeds. |
| `build/path/ra_engine_raw.js`, `rabank.js` | RA engine; 14 algebra exercises (joins, difference, division, max without aggregation). |
| `build/path/norm.js` | Closure, keys, canonical cover and checker, NF, lossless (binary and chase), dependency preservation, projected NF, 3NF synthesis, exam-like generator, traces, 10 real exam instances. |
| `build/path/stage2.js` | Modules: triggers (kind, missing line, trace simulators), ER (true/false, tables → pattern, notation), indexes (B+ with bug distractors, hashing, structure calculations), estimation, algebra results. |
| `build/path/path.js`, `path.css` | The path engine and UI: 7 units, 31 skills. |
| `build/tests/` | `t_norm`, `t_sql` (seed search and mutation tests), `t_rab`, `t_s2` (B+ vs original engine, generator self-checks); `walk_*.js` (Playwright ladders); `shots_viz.js`. |

To rebuild: `sh build/build.sh`. To test: `cd build/tests && node t_norm.js && node t_rab.js && node t_s2.js &&
node t_sql.js`, then the walks (`NODE_PATH=$(npm root -g) node walk_stage2.js <page.html> 1280`). The page for
the walks is `db-exams.html` wrapped in a doctype, `<html lang="he" dir="rtl">` and `<body>`.

## Course conventions the checkers rely on

- **B+**: `n` is the maximum number of pointers; a leaf holds at most n−1 values. A leaf split keeps ⌈n/2⌉ on the
  left and *copies* the first right value up. An internal split moves the middle value up. For counting: the
  root has at least 2 children, other internal nodes at least ⌈n/2⌉; with h levels there are at most n^(h−1)
  leaves.
- **Extendible hashing**: prefix bits, starting from the left. A full bucket with j = i doubles the directory and
  then splits; with j < i it only splits. The minimum directory is 2^⌈log₂⌈N/b⌉⌉.
- **Estimation**: |σ_{A=c}(r)| = n_r / V(A, r); after a selection, V = min(V, |σ|); an equi-join gives
  n_r · n_s / max(V, V). This is the method the graders accepted in 2019א, 2020ג and 2021א.
- **SQL**: only the allowed operations (no join … on, limit, extract, coalesce, is null; `with` only where
  allowed). Use `>= all` for a maximum with ties; "correct for every date" means `date_part` against
  `current_date`. A null check without `is null` is written `x.tdate = x.tdate` inside `not exists`.
- **Triggers**: a guard is `before insert` with `return null` (raise exception aborts the whole statement); a
  maintainer is `after insert`, `return new`. Inside a before trigger the count excludes the new row. The sum of
  an empty set is null, so handle it with `if not exists`.
- **ER notation**: the arrow points to the "one" side; a double line means total participation; a weak entity
  has a double box, a double diamond and a dashed underline; ISA with disjoint/total labels.

## Exam statistics (22 exams; "recent" = the 11 since 2019)

- Average points in written exams:

  | Topic | Points |
  |---|---|
  | SQL | 20 |
  | Normalization | 20 |
  | ER | 18.6 |
  | Algebra | 18.6 |
  | Trigger | 8.7 |
  | Estimation | 6 |
  | Hashing | 4.3 |
  | B+ | 4 |

- Frequency, old vs. recent: triggers rose from 3 to 9, hashing from 2 to 7, estimation from 5 to 8. ER, SQL,
  algebra and normalization appear in every exam.
- ER true/false: 45 "not true" vs. 36 "true" (81 statements; 77 are mapped to their diagram).
- Normalization:
  - lossless was the right answer in 14 of 19;
  - dependency preserving in 7 of 16;
  - a BCNF decomposition preserving dependencies was possible in 9 of 12;
  - R itself was never in BCNF.
- Candidate keys: 2 in most exams, up to 5.
