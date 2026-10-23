# The study page: structure, Hebrew bidi, checks

Load `artifact-design` (or run the Artifact quickstart) before writing the page. This file covers the parts
specific to this project.

## Modes (tabs, hash routes)

| Route | Mode | Content |
|---|---|---|
| `#exams`, `#exam-<id>` | Exams | Side navigation by period; each exam has the stage-1 analysis text, topic chips and source badge (official / scanned notebook with grade / grader marks / proposal / none), plus a lazy list of every item: the question, the full solution, "why it works", diagrams and a citation. |
| `#study`, `#study-<topic>` | Study by topic | Topic cards with frequency since 2019 and average points. Each topic page has: how to recognize it, the recipe, concepts and formulas (the formula, what every symbol means, a mini example, a diagram), worked examples with step reveal, patterns and code, traps, flashcards with know/don't-know, true/false from real exams, and every exam item for the topic (recent first). |
| `#stats` | Statistics | KPIs, an exam × topic heatmap with points, old-vs-recent frequency (dumbbell), points per topic, SQL idiom frequencies, trigger kinds, normalization parts, number of keys, normal-form answers, lossless and dependency-preservation answer split, true/false split, B+ n values, source quality. Every card has a "how this was counted" line. |
| `#path` | Learning path | See `path-engine.md`. |

Keep mode state in the hash and handle `hashchange`. In tests, a same-document hash change needs `reload()`.
Use `localStorage` (wrapped in try/catch) only for conveniences: the last mode, known flashcards, done topics.

## Hebrew RTL and bidi (most bugs were here)

- Wrap a math or code run inside Hebrew prose in `<bdi dir="ltr" class="m">…</bdi>`. Add class `n` (nowrap) for
  short runs (about 26 characters or fewer). Long runs may wrap, but a wrapped isolate can reorder across lines,
  so split long lists into several short `bdi`s.
- **Formula blocks** (`.fml`, LTR, `white-space: pre-wrap`) hold pure math. A Hebrew label goes on its own RTL
  line, `<div dir="rtl" class="rl"><span class="lb">label:</span> <bdi dir="ltr">math</bdi></div>`. Hebrew words
  inside an LTR formula scramble.
- **Code**: `<pre dir="ltr">` and `<code dir="ltr">`. In option buttons, give the button `direction: ltr`.
- **SVG diagrams** set `direction: ltr` and use English labels; Hebrew labels need the body font.
- **A sentence ending with an LTR run**: the period sits to the left of the run, and that is correct. Before
  "fixing" a reversal, inspect the DOM (`getComputedStyle(bdi).direction`).
- When converting markdown to HTML, watch for `&lt;` / `&gt;` double escaping inside code (`fixent()` in the
  kit's build.py).

## Diagrams

Reuse the kit's engines: `ERX.build(spec, k)` (ER with entities, relationships, arrows, totals, roles, ISA,
relationship attributes, a step number `s` per element), `bptSVG(root, hl, n)`, `exhSVG(state, table)`, and the
`BPT` and `EXH` engines. They sit behind `<div class="viz" data-v='{"kind": …}'>` placeholders, mounted by
`mountViz(root)`:

- `erx`: a step player, with click-for-meaning;
- `bpt-final` / `bpt-play` and `exh-final` / `exh-play`: players that start at the final state;
- `closure` (attribute chips growing step by step), `sqlflow`, `trigtime`, `division`.

Wrap every diagram in an LTR horizontal scroller. Size SVGs with `width: 100%`, `max-width` equal to the natural
width, and `min-width: min(w, max(270, .6w))`. On wide screens, concept cards with diagrams span two columns.

## Screenshot checklist

- Every mode at 1280 light and 390 dark, plus each topic page, plus the path home, a player per kind, and
  feedback (both right and wrong).
- Horizontal overflow = 0 (`scrollWidth - innerWidth`). No page errors, and no console errors other than the
  sandbox's blocked font requests.
- Look for: reversed math, feedback split into rows, tiny or clipped diagrams, a sticky header covering element
  screenshots (add `.top{position:static}` for tests), and cards disappearing after a re-render.
