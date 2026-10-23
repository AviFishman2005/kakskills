---
name: "mmn-solver-20277"
description: "Solve a ממ״ן (מטלה) in Database Systems 20277 into an interactive Hebrew study page: full answers, step-by-step animations, concepts tab and lab. Use for any 20277 assignment on ER, FDs, normalization, algebra or SQL."
---

# פתרון ממ״ן בבסיסי נתונים (20277) כדף לימוד אינטראקטיבי

The user is a student in Database Systems 20277 at the Open University of Israel. They don't want a bare answer key. They want one Hebrew (RTL) page that lets them:
- read every question in full, right above its solution;
- copy a complete, well-argued answer for submission;
- walk through the solution step by step, with animations that show the mechanism (a closure growing, a diagram being built, a table splitting);
- understand *why* each step works, see common mistakes and try a similar example;
- open any concept in a separate "learn the material" tab built from the course's own study guide and slides;
- practise in a small lab that recomputes closures, keys, canonical covers and decompositions;
- jump around (to the data of an earlier assignment, to a concept, to the lab) and press one button to come back to where they were.

A finished example exists: ממ״ן 03 (ER + normalization), https://claude.ai/artifact/6ZiSLFq234Yebwe3bnb6e3. When unsure about structure, wording or look, read it (Artifact `read`) and follow it.

## Where the course material lives

Everything is stored in the user's private materials artifact: `https://claude.ai/artifact/4DMtKm15u2xwPicGXb9Eoj`. Fetch files with the Artifact tool, `action: "read"`, that url, and `paths: [...]`; the result says where each file was saved.

| Path | What it is |
|---|---|
| `course/20277-study-guide.pdf` | מדריך הלמידה, 301 pages. **Printed page N = PDF page N+2.** Personal copy marked "do not distribute": use it, never publish or share it. |
| `course/mmn01.pdf` | ממ״ן 01: the restaurant-chain schema (Restaurant, DiningTable, Dish, Ingredient, indish, Reservation, Orders) with a Hebrew description of every relation, then relational-algebra questions. Later assignments refer back to this schema. |
| `course/mmn02-hw2-graded.sql.txt` | The student's ממ״ן 02 (SQL on the same schema) with the grader's comments. Useful for SQL style and for what the grader penalises. |
| `course/mmn03.pdf` | ממ״ן 03 (ER, FDs, normalization). Solved in the example page. |
| `course/slides-normalization.txt` | Slides "תיכון בסיס נתונים": Person(id,name,address,zip) decomposition example, FDs, Armstrong, closure, canonical cover ("2 reasons to delete from the left: duplicates / remaining attrs imply it"), keys rule, dependency preservation, 3NF/BCNF definitions, 3NF and BCNF algorithms, ~16 practice questions. |
| `course/slides-erd-to-tables.txt` | Slides "הפיכת דיאגרמת ERD לטבלאות": restaurant-inspection example, rules 1–8 (strong entity, weak entity, multivalued attribute, M:N, N:1 with participation, ISA). |
| `template/head.html` | All CSS: tokens, the four skins (auto / light / colorful "pop" / dark), every component style. |
| `template/app.js` | All page behaviour (see "Components" below). Reuse it; extend rather than rewrite. |
| `template/build.py` | `python3 build.py head.html app.js out.html body1.html body2.html …` concatenates and wraps English/formula runs inside Hebrew prose in `<code>` for bidi. Also writes `out-preview.html` for local screenshots. |
| `template/fd.py` | Closure, candidate keys, implication, restriction. Use it to verify every FD answer. |
| `template/check-screens.js` | Playwright screenshot script used for the example (selectors are example-specific; adapt). |
| `template/example-*.html` | The example's source parts: `2_sol_a` (header, Q1–Q2), `3_sol_b` (Q3–Q5), `4_learn` (learn tab + lab tab), `m01` (earlier-assignment data section), and the built page. |

If the user attaches a newer assignment, slides or a file the store lacks, use theirs, and offer to add it to the materials artifact (publish to that same url with an extra entry in `files`).

### Study-guide chapters (PDF pages)

| Chapter | Topic | PDF pages |
|---|---|---|
| 1 | מבוא | 11–18 |
| 2 | מודל היחסים, אלגברה של יחסים | 19–48 |
| 3 | מבוא ל-SQL | 49–84 |
| 4 | SQL רמת ביניים | 85–118 |
| 5 | SQL מתקדם (+ נספח תשובות) | 119–140 |
| 6 | מודל ישויות-קשרים | 141–174 |
| 7 | תיכון במודל היחסים (FD, כיסוי קנוני, פירוקים, 3NF/BCNF) | 175–212 |
| 8 | טיפוסי נתונים מורכבים | 213–237 |
| 9 | אחסון ומבני קבצים | 238–244 |
| 10 | אינדקסים | 245–273 |
| 11 | עיבוד שאילתות | 274–301 |

Every assignment states its material in the header ("חומר הלימוד למטלה: פרקים …"). Read those chapters before solving. `pdftotext -layout` works for this guide (Hebrew lines come out readable enough), so extract the chapter range to text and grep for definitions, algorithms and the guide's own examples. Use the guide's terminology and its examples in the learn tab, and cite "מדריך הלמידה, פרק X, סעיף Y" under each section.

Chapter 6 notation (the course follows Silberschatz 7th ed.): entity = rectangle with name header and attributes listed inside; primary key underlined; relationship = diamond; **arrow from the diamond to the "one" side**; **double line = total participation**; relationship attributes in a small rectangle joined to the diamond by a dashed line; weak entity linked by a **double diamond** with a double line, its discriminator **dash-underlined**; multivalued `{phone}`; derived `age()`; ISA = hollow arrow, `total` label, disjoint = one shared arrow. ER→tables rules א–ו are in the guide (printed pp. 158–162, PDF 160–164) and match the slides.

## Workflow

Make a task list (read → materials → solve → verify → build → check → publish). Tell the user in one line what you're doing, then start.

### 1. Read the assignment

Read the PDF visually (`pdftoppm -r 110 -png`), not only with `pdftotext`: underlines that mark primary keys, arrows and math vanish in text extraction (the Orders key `(resid, lineno)` in ממ״ן 01 is visible only in the image). Record: number, semester, chapters, every question with parts and points, and every reference to an earlier assignment ("הנתון בממ״ן 01"). If a referenced assignment isn't in the store or the conversation, look in the user's connected folders, then ask for it before building that question. Never reconstruct a missing description from guesswork without saying so on the page.

### 2. Solve, with the course's methods

- **ER diagrams.** Go sentence by sentence through the description. For each sentence decide: entity, relationship, attribute of an entity, attribute of a relationship, cardinality (arrow), participation (double line), key, weak entity. Keep a table "sentence → diagram element"; it becomes a section of the page. Details only stated as constraints the notation can't express (domains like 0–3, NULL allowed, cross-entity checks) go in a note under the diagram. Ambiguous modelling choices (relationship-with-attributes vs weak entity, e.g. "can the same pair repeat?") get one chosen answer plus a box explaining the alternative and how the true/false answers would change.
- **True/false "לפי הדיאגרמה בלבד".** Translate the claim into one notation question: "how many" → arrow; "must / can be without" → double vs single line; "can repeat" → keys / weak entity. Name the element and what you see on it.
- **ER → relations.** Apply rules א–ו in order; underline PKs; note FKs; note that total participation isn't expressed in schemas.
- **Canonical cover.** Split RHS → extraneous LHS attributes (closure of the reduced LHS under all FDs, including the one tested) → redundant FDs, one at a time with the set updated after each deletion → union. Show every check. Say when the order of checks could give a different, equally valid cover, and give it.
- **Candidate keys.** Classify attributes: only-left (in every key), only-right (in none, judged on the canonical cover), both. Test closures from small to large, skipping supersets of found keys. List the closure chain for each tested set.
- **Normal forms.** For each FD of Fc: trivial? LHS superkey? every RHS attribute prime? One failing FD decides.
- **Decompositions.** 3NF synthesis (table per Fc FD, drop contained tables, add a key table) when dependency preservation is required; then report each table's keys and NF (often all BCNF). BCNF algorithm: violating X→Y ⇒ X∪Y and S−Y, recompute restriction, repeat; then test preservation with closures over the restricted sets. Lossless binary test: R1∩R2 → R1 or R2.
- **Restriction (צמצום).** For every subset X of Ri: (X⁺ ∩ Ri) − X. Show the closures in a table and give a canonical form.
- **Relational algebra (ch. 2) and SQL (ch. 3–5).** Use the course's operators and no assignment operator if the question forbids it; for "only", "all" and "maximum" use the standard patterns (difference, division or double difference, self-join with comparison). For SQL follow the grader's notes in the ממ״ן 02 file: no nesting in FROM when the course forbids it, use `HAVING … >= ALL`, check status/date conditions the description implies, use `date_part`/`current_date` when "this year/month" appears. When a question gives relation instances, compute the results in code and show them as tables.

### 3. Verify before building

- Run every FD answer through `fd.py` (equivalence of Fc with F both ways, no extraneous attributes left, keys, restrictions, preservation). Add the checks for the new assignment at the bottom of a copy of the file.
- For algebra/SQL with given instances, evaluate the expressions in Python over the instance tables and compare with your hand results.
- Re-read each argument as a grader would. Fix wrong reasoning even when the final answer is right, and tell the user.

### 4. Build the page

Load the `artifact-design` skill (or use quickstart) before writing, if it isn't loaded. Fetch `template/head.html`, `template/app.js`, `template/build.py` and the example parts. Write new body parts in the same markup, adapt the data in `app.js` (diagram specs, term dictionary, lab presets), build with `build.py`, check, publish.

**Page structure**

1. Sticky header: course line, title `ממ״ן NN · <topic>`, skin switcher (אוטומטי / בהיר / צבעוני / כהה; default צבעוני), tabs **פתרון המטלה / לומדים את החומר / מעבדת …** (lab only when the topic has computable objects; for SQL or algebra a "query lab" over the sample instance can replace the FD lab).
2. Solution tab:
   - question nav chips (one per question with points, plus a chip for any earlier-assignment data section);
   - a short legend of the three modes and the dashed concept buttons;
   - one `<article class="q" id="qN">` per question: heading + points, the shared givens (scenario text fully visible, R and F in an `.fx` block);
   - one `<div class="sub" id="qNx">` per part: tag letter, title, points, then **`.qtext` with the exact question wording and its givens repeated**, then the mode switch and the three modes:
     - **תשובה להגשה**: `.ans` box with a copy button; full submission text, Hebrew prose with formulas in their own `.fx` blocks or `.ck` tables; final verdicts as `.pill` (ok/bad/n);
     - **צעד אחר צעד** (or **נסו בעצמכם** for true/false): a `.stepper` with closure animations, building diagrams, appearing table boxes, guess-then-reveal rows that highlight the diagram element;
     - **למה זה עובד**: `.box.tip` (method and why), `.box.warn` (common mistakes, alternative modelling), `.box.ex` (another example from the slides/guide with its answer and a button that opens it in the lab).
   - an earlier-assignment data section (`#m01`-style) when a question builds on a previous assignment: the schema with underlined keys, the description with constraint sentences in `<mark>`, and a table "sentence → diagram element" whose buttons jump to and highlight the element.
3. Learn tab: sticky TOC + one `.lsec` per concept of the assignment's chapters, each with a source line, a `.def` definition, explanation, examples from the guide/slides, and where useful a demo (cardinality toggles, lossless-join animation with spurious rows in red, closure animation) or a 1-question `.quiz`. End with a summary table ("דף סיכום").
4. Lab tab (when relevant): R / F / X / decomposition inputs, presets for the assignment's questions and the slide exercises, actions that print a step-by-step log.
5. Footer: what was verified and how, and anything the solution assumes.

### Components in `app.js` (markup contracts)

- Tabs: `.tabs button[data-tab]` ↔ `section#tab-<name>.tab`. `showTab(name, anchorId, keep)`.
- Navigation history: any `a[href="#id"]`, `.jump[data-to=id]`, concept "להסבר המלא", tab switches and lab buttons push `{tab, scrollY, label}`; a floating "↩ חזרה למקום הקודם" button (and Alt+arrow) pops it. Route every new kind of jump through `goTo(id)` or call `remember()` first, so nothing loses the reader's place.
- Modes: `.sub > .modes button[data-m]` toggles sibling `.mode[data-m]`.
- Stepper: `.stepper > section.step > h4 …` gets prev/next, dots, "הצגת הכל".
- Closure animation: `<div class="clo" data-r="ABCDE" data-f="A>BD,BC>BE" data-x="A" data-title="A⁺" data-off="2">` (`data-off` = indices shown struck out, for "closure without this FD").
- ER diagrams: `<div class="er" data-spec="q1" data-mode="full|build" data-name="q1a">` reading `SPECS.q1 = {w,h, ents:[{id,x,y,w,a:[["rid","pk"],["tno","disc"],["city"]],s,info}], rels:[{id,x,y,rw,ident,s,info}], links:[{id,e,r,total,arrow,s}], rattrs:[{id,r,x,y,w,a,s,info}], notes:[{x,y,t,s}], steps:["…"]}`. `s` is the build step; entity height is 36 + 19·attrs, so lay out coordinates with that. Labels in the SVG stay English (no bidi problems); explanations are Hebrew.
- True/false: `.tf[data-dia=<data-name>] > .tf-row[data-ans="t|f"][data-hl="ids"]` with `.guess` buttons and a hidden `.tf-a`.
- Copy: `.ans > .ans-h (b + button.copy) + .ans-b`; copies `innerText`, falls back to selecting.
- Concepts: `<button class="term" data-k="closure">` → `TERMS[k] = [title, short definition, learn-section id]`. Add terms for every new concept.
- Jumps: `<button class="jump" data-to="q1a" data-hl="Dish,l-contains-dish">` switches the part to its answer mode and highlights diagram elements.
- Quiz: `.quiz[data-right="b"] .opts button[data-o] + .fb`.
- Demos with ids `#cd-demo` (cardinality) and `#ll-demo` (lossless join on the slides' Person data) live in the learn tab.
- Lab: `#lab-r #lab-f #lab-x #lab-d`, `.lab-act button[data-act=closure|keys|canon|nf|3nf|bcnf|decomp]`, `PRESETS`, and `[data-lab="R|F|act|decomp"]` buttons anywhere on the page. Its engine (closure, canon with log, keysOf, restrictF, nfOf, synth3, bcnfDec, chase, preserves) is reusable for new demos.
- Static pieces: `.rels > .rel` (schemas, `<u>` for PK, `.fk`), `.tbls > .tb` (table boxes with `.k` key attrs and `.nf` label), `.tree` (BCNF splits), `.ck` (check tables), `.dt` (data tables), `.qtext`, `.notice`, `.box.tip|warn|ex`.

For new topics write new components in the same spirit, one per mechanism, never generic: e.g. relational-algebra evaluation where each operator's intermediate table appears in turn (σ dims filtered rows, ⋈ draws matching lines, − strikes rows), a division animation, SQL `GROUP BY` buckets forming then `HAVING` removing groups, an index/B+-tree insertion stepper. Implement them over small in-page JS arrays; the artifact sandbox blocks fetches, so don't rely on wasm SQL engines.

### Design

Keep the example's identity: "schema notebook" (diagrams on faint grid paper, formulas in LTR mono blocks), fonts Secular One (display) / Assistant (body) / JetBrains Mono (formulas, with Consolas fallback). Four skins via `data-skin` on `<html>`, chosen in the header and remembered in localStorage (try/catch):
- **צבעוני (pop)**, the default: warm white background with soft pink/blue radial washes, violet accent `#7A2EF0`, a rainbow strip under the header, gradient title and selected tab, and **one colour per question** (q1 `#E0247A`, q2 `#F0700E`, q3 `#0AA58C`, q4 `#2F6FEB`, q5 `#7A2EF0`, data section `#C99A00`) applied to the question's top border, heading, part tags, question box, answer box and nav chip. Add `--q6…` and `#qN{--qc:…}` lines for more questions.
- **בהיר**: calm teal `#0E6B72` on `#F2F5F4`. **כהה**: `#0E1417` background, `#50BCC2` accent. **אוטומטי**: follows the host theme (bare `:root` + `prefers-color-scheme` + `[data-theme]` blocks, as required for artifacts).

### Hebrew, RTL and bidi (the user's standing preferences)

- Hebrew text RTL. English terms, attribute names and formulas inline inside Hebrew are wrapped in `<code>` (build.py does this automatically for prose; check its output).
- Formulas, code and long derivations go in separate `.fx` blocks, never mixed into a sentence. **A `.fx` block must not contain Hebrew**: mixed lines render scrambled. When a check needs both (e.g. "A→B · without it A⁺={A,D,E} · stays"), use a `.ck` table with Hebrew cells and `<code>` cells.
- Punctuation goes at the end of the sentence block; lists start with Hebrew text or bullets, not LTR punctuation.
- Apply the same rules inside copy texts, the lab log (`bidi()` in app.js) and the learn tab.

### 5. Check (once, then fix)

- `node -e` with `new Function(script)` on the built page's inline script.
- Headless Chromium (Playwright, `executablePath:'/opt/pw-browsers/chromium'`) on `out-preview.html`: no page errors; `scrollWidth` equals viewport width at 400px for every tab; screenshot a diagram, a stepper with a played closure, a true/false reveal, the lab output and the colorful skin; click a jump then the back button twice and confirm the scroll position returns.
- Known traps already fixed in the template, keep them fixed: attribute values containing `>` (e.g. `data-f`) break naive tag regexes, so build.py splits tags with a quote-aware pattern; any element with its own `display` needs an explicit `[hidden]` rule (`.back[hidden]`); grid/flex children that hold tables need `min-width:0` or the page scrolls sideways on phones.

### 6. Publish and report

Publish the page with the Artifact tool (icon `database`). For changes later, republish the same file path so the link stays. The final reply is short and in Hebrew: what the page contains, what was verified and how, any modelling choice or assumption the student should know (and that it is explained on the page), and anything missing (e.g. an earlier assignment you couldn't find). Don't paste URLs; the card carries them. Remind the student in one line to write the submission in their own words.