# The learning-path engine

The reference implementation is `assets/engine/path.js` and `path.css`; the 20277 kit has the full build. This
file explains the moving parts, so the engine can be extended or rebuilt for another course.

## Contents
1. State document
2. Skills, ladders and transitions
3. Scheduling
4. Sessions
5. Problem kinds and the module interface
6. Rendering rules
7. Sync

## 1. State document

One JSON object, kept small (well under the 256 KiB per-document limit):

```js
{v: 1, updatedAt, examDate: 'YYYY-MM-DD' | null, diag: {done},
 skills: {[sid]: {rung, sub, streak, lvl, due, rev, relearn, fails, seen: {exerciseId: n}, ok, n, exi}},
 calib: {sure: [ok, n], think: [ok, n], guess: [ok, n]},
 misses: [{s: sid, t: date, d: label}],   // last 20 "sure but wrong"
 log: {'YYYY-MM-DD': count}, drills: [ok, n], mixed: {d, ok, n}, mixedBest, drillDay: {d}, ctr}
```

- `lvl`: 0 new, 1 learning, 2 learned today, 3 one review passed, 4 mastered (two reviews passed).
- `rung`: the position in the skill's ladder.
- "Started" means `Object.keys(S.log).length > 0`. Don't use `Object.keys(S.skills)`: rendering creates empty
  skill records, and the first-run card then vanished after the first re-render.

## 2. Skills, ladders and transitions

Each skill has a `kind` and a ladder:

- **Full ladder**: `example → complete → hints → solo`. Used for written and generated problems.
- **MCQ ladder**: `example → hints → solo`. Used when there is no meaningful "complete the end" form.

Transitions are recorded on the **first** attempt only. A retry after feedback is for learning and never counts.

| Mode | On correct | On wrong |
|---|---|---|
| example | rung + 1 (after the "why" question) | n/a |
| complete | sub + 1; after two, move to the next rung | stay |
| hints | next rung; streak = 1 if no hint was used, else 0 | stay |
| solo | streak + 1; at 3 (2 after a relapse) the skill is learned, `due = today + interval(0)` | streak = 0; two wrong in a row drop to hints |
| review (due) | rev + 1, lvl = min(4, 2 + rev), `due = today + interval(rev)` | relapse: lvl 1, rung = hints, `relearn` |
| mixed | counts as a review if the skill was due | due = today |
| diag | correct and confident → solo with streak 1; correct but guessed → hints | stays at example |

## 3. Scheduling

`interval(k)` uses the base gaps [1, 3, 7] days. With an exam date, it shrinks to `floor((daysLeft - 1) / (3 - k))`,
and is at least 1. The today plan is built in this order:

1. every due review;
2. the current skill, which is the first not yet learned in path order;
3. a pattern drill, if any SQL skill is learned;
4. a mixed round, if two or more skills are learned and no mixed round was done today.

Estimate about 3 minutes per review, 15 per learning block, 4 for drills and 12 for a mixed round.

## 4. Sessions

A session is a queue. A `learn` item keeps re-inserting itself until the skill is learned, for at most 8 steps.
In the today session it then continues with the next skill. Kinds: today, skill (one ladder), practice (three
solo problems), diag (one solo problem per skill, with a skip button), mixed (6 interleaved items), drill (6
items). The finish screen reports correct solo answers and the skills learned, with their next review date.

## 5. Problem kinds and the module interface

- **Written** (`sql`, `ra`): the exercise bank supplies the question, the schema, the reference solution, the
  fades for completion, the hints and the wrong variants with their explanations. Checking runs the answer on
  datasets A (visible) and B (hidden) and compares row sets.
- **Structured**: normalization, plus any generated module. Implement this interface, one object per module:

```js
{
  skills: {key: {ladder: 'full' | 'mcq'}},
  mcq: {key: {q, opts, a}},          // the "why" question shown after the worked example
  gen(key, seed) -> q,               // a new problem; deterministic per seed
  example(key, i) -> q,              // prefer real exam instances
  html(q) -> string,                 // the givens + the question (diagrams via vizDiv)
  input(q) -> {type: 'mcq'|'multi'|'text'|'rows'|'nums', opts?, fields?, ph?, help?, fixed?},
  solve(q) -> {steps: [{h, b}], ans, show},   // steps double as hints and as the completion prefix
  check(q, value, sol) -> {ok, why?, note?}   // why = the explanation of THIS mistake
}
```

Value shapes: mcq → index; multi → sorted indexes; nums → array of strings; text / rows → string.

MCQ options are shuffled at render with a permutation, so the right answer isn't always first. Set
`input().fixed` for true/false and for ordered scales.

## 6. Rendering rules (learned the hard way)

- Feedback and "why" boxes use `display: block` with `>* + *` spacing, never grid. Under grid, every inline
  `<bdi>` became its own row.
- Math and code inside Hebrew go in `<bdi dir="ltr" class="m n">…</bdi>`. Code blocks use `pre dir="ltr"`.
  Answer options that are code use `code.g-line` inside an LTR button.
- Keep the user's input when re-rendering for a hint: read the field, re-render, write it back.
- For a completion, blank the fragment in the **raw** reference before formatting it:
  `fmt(ref.replace(fade, '▢▢▢▢'))`. Formatting the fragment separately fails across line breaks.
- Never use `prompt()`, `alert()` or `confirm()`. Use a two-click confirm button and inline text areas.
- After rendering any problem or feedback that contains diagrams, call `mountViz(root)`.

## 7. Sync

```js
const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
const uid = await user.id();
const ref = db.doc(`data/users/${uid}/path`);   // 4 segments = a document; private per viewer by default
```

- **On load**: read `localStorage` first and render. Then fetch remote and keep whichever has the newer
  `updatedAt`. If the local copy is newer, push it.
- **On change**: write `localStorage` at once. Debounce the db write by 1.2 s, keep one write in flight, and
  flush when `document.hidden`. When the tab becomes visible, pull again.
- **Status line** (always shown): saved to account / browser only / read-only / error. If `use()` returns null
  (no viewer, signed out), the page works locally and points to the backup code.
- **After publishing**: run `ArtifactData list` on `data/users/me` to confirm the path. It is empty until the
  user's first session.
