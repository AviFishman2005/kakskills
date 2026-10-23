---
name: "mmn-solver-20476"
description: "Solve a ממ״ן assignment PDF in Discrete Math 20476 into a Hebrew study kit: explained solution page with animations, cheat-sheet citations, copy-ready write-ups, practice page and PDFs."
---

# פתרון ממ״ן בבדידה (20476) כערכת לימוד

The user is a student who finds the material hard. The output is not just answers: it is a kit that lets them understand every step, see where each fact comes from on the official cheat sheet, write the solution in their own words, and then prove to themselves they can solve a similar question alone. Everything the student reads is in **simple Hebrew**, RTL.

A finished example from a previous assignment (ממ״ן 03, cardinalities and induction) exists. When unsure about structure or look, read it with the Artifact tool's `read` action and follow it:
- Solution page: https://claude.ai/artifact/A3oWdmGo8hfPYym7mtJUnd
- Practice page: https://claude.ai/artifact/BFML7yMDnRP1gdSdtZXNfA

## What to deliver

1. **Solution page** (HTML artifact, published): every question and part, a final-answer box, numbered steps, a yellow cheat-sheet tag on every step that uses a theorem, one interactive demo per part, a collapsible "מה לכתוב במטלה" copy box per part, and at the end a summary of the cheat-sheet items used, with the marked sheet pages as images.
2. **Practice page** (separate HTML artifact): new exercises, not from the assignment, that check the student can solve alone, with instant feedback and a readiness summary.
3. **answers.pdf**: final answers table (with a column of cheat-sheet item numbers), a legend page of the items, and the marked sheet pages appended.
4. **cheat-sheet-highlighted.pdf**: the full sheet with the items used highlighted in yellow and numbered in blue circles.

Make a task list first (read → solve → verify → solution page → practice page → PDFs → check → publish). Tell the user in one line what you're about to do, then start. Send drafts as they become useful.

## Step 1. Read the assignment correctly

Render the PDF pages to images and read them visually (`pdftoppm -r 110 -png file.pdf pg`). Do not trust `pdftotext` for this: Hebrew comes out reversed and math (subscripts, ∑, ℵ, set braces) gets garbled. Note the course number, assignment number, semester, due date, every question with its parts and point weights, and any "you may rely on claim X without proof" sentences. Those given claims are citable just like sheet items.

## Step 2. Get the cheat sheet (no attachment needed)

The course נוסחאון is stored in a private artifact:
`https://claude.ai/artifact/NKV99YRFpqZdteHM4eNT7K`

Fetch it with the Artifact tool: `action: "read"`, that url, `path: "cheat-sheet-20476.pdf"`. The result says where the file was saved. Copy it into the scratchpad as `cheat.pdf`. Page images are also stored there (`p-01.jpg` … `p-12.jpg`). If the user attaches a different or newer sheet, use theirs instead.

Page numbering: the sheet's **printed** page N is **PDF page N+1** (the cover is PDF page 1). Always cite printed page numbers to the student.

The index at the end of this file lists what is on every page, with section numbers, so you can choose citations before opening the PDF.

## Step 3. Solve

For each part write: the final answer, then numbered steps. The rules:

- **Build every argument from sheet items.** When a step relies on a theorem, definition or standard fact, it should be a numbered sheet item (or a claim the question allows). Prefer the sheet's version of a fact over a home-made argument, because the student will look it up there. If no sheet item fits (pure algebra, say), state that plainly in the step ("בסעיף הזה אין נוסחה מדף הנוסחאות: זה חישוב אלגברי").
- **Be rigorous about what a fact actually gives.** Known traps from earlier work:
  - "Not countable" does not by itself mean "cardinality ℵ". To get ℵ you also need an upper bound plus a sum rule, for example §5.4: κ infinite ⇒ κ + ℵ₀ = κ, applied to a disjoint union.
  - The course's ℕ starts at 0 (§5.8). Index digits and sets accordingly, e.g. ⋃ₙ P({0,1,…,n}).
  - By the sheet's definition, "countable" (בת מניה) includes finite sets (§5.1). Say so when you use it, e.g. unions of finite sets.
  - The sheet writes 2^ℵ as ℵ′. Give both in the answer: "2^ℵ (בדף הנוסחאות: ℵ′)".
  - A function onto gives |A| ≥ |B|. A one-to-one function gives |A| ≤ |B|. Equality needs both, or a bijection, or קש״ב.
- **Number the items you use** in the order they appear on the sheet (page, then position), starting from 1. These numbers are shared by the page tags, the copy texts, the PDF legend and the circles on the marked sheet, so assign them once in a single data file (Step 5) and generate everything from it.

## Step 4. Verify before building

- Check everything checkable with code: identities over many n, polynomial roots (numeric residual), constructions such as "a rational point inside every disk" with random tests and exact `Fraction`s, injectivity/reconstruction arguments on random data. `sympy` may be missing; fall back to floats and `fractions`.
- Re-read each proof as a grader would. Does each step follow from the cited item? Is any assumption hidden? Fix wrong reasoning even when the final answer is right, and tell the user what you changed.
- Cross-check that each item's declared "used in" list matches where the steps and copy texts actually cite it. Do this with a script, not by eye.

## Step 5. Build the solution page

Generate the page from Python data, not by hand-editing HTML, so the numbering stays consistent:

- `cheat_items.py`: `ITEMS = [dict(pdf=6, page=5, sec='5.7', side='L', boxes=[(x0,top,x1,bottom)], f='$A, B$ בנות מניה ⇒ $A × B$ בת מניה', qs=['q1b','q3']), …]`. Inside `f`, `$…$` marks math runs. `boxes` are the PDF coordinates used for highlighting (Step 7).
- `content.py`: `STEPS[part] = [html strings with [[n]] for sheet item n and $math$]`, `TEXTS[part] = [plain lines, or an int n meaning "insert a reference line to item n"]`, `IDEA[part]` (one plain sentence), `FINAL[part]`.
- `build.py`: converts `[[n]]` into a tag plus the quoted formula, `$…$` into `<span class="m">`, `$$…$$` into a block `<span class="mb">`, writes the copy texts into the page as JSON (`const T=` + `json.dumps(..., ensure_ascii=False)`), and checks that every `data-go` target id exists.

**Page structure, top to bottom:**
1. Header: course and assignment (eyebrow), title, one-line lead.
2. Sticky nav: one button per question plus "דף נוסחאות".
3. Summary table: סעיף | תשובה סופית | מדף הנוסחאות (small blue numbered buttons that jump to the item).
4. "מה לקחנו מדף הנוסחאות" box: explains the yellow tag with one live example, plus a button to the marked sheet. If the questions span cardinalities, add a "ladder" of the cardinalities (ℵ₀ / ℵ / 2^ℵ) with chips jumping to the parts at each level.
5. One `<section class="q">` per question, with a heading, points and task text. Each part is an `<article class="part">` holding:
   - a green final-answer box (`תשובה סופית`);
   - `<ol class="steps">`, each step short, with bold lead-ins such as "חסם עליון." or "הנחת השלילה.";
   - an optional muted "why" note for the subtle point;
   - `<details class="write">` "מה לכתוב במטלה, עם המשוואות ומה לקחת מדף הנוסחאות", containing "הרעיון בקצרה" (one simple sentence), the copy text in a `<pre>`, and a "העתק ניסוח" button;
   - a dashed `.demo` box with a small interactive animation (see below).
6. "דף הנוסחאות שבשימוש" section: a list of all items (number circle, yellow formula, "עמ׳ X · סעיף Y · שימוש:" with chips to the parts), then the marked sheet pages as embedded base64 JPEG images, the most-used page first.
7. A closing note: the solution is for learning, and the student should write it in their own words and be able to explain every step.

**The cheat-sheet tag** (wherever a step uses an item):
```html
<span class="from"><button type="button" class="cs" data-go="cs23" title="דף הנוסחאות, עמ׳ 5, סעיף 5.7">דף נוסחאות 23</button><mark class="hl">…formula…</mark></span>
```
Blue pill (`--hl-badge`), yellow highlight (`--hl`). Clicking scrolls to `#cs23` and flashes it. Use the same colors as the marks on the PDF sheet, so yellow always means "taken from the sheet".

**Copy texts (the "מה לכתוב" box).** Write each one as the student would submit it. Start with the answer and the notation, then numbered stages, **with an equation on its own line in every stage** (the student asked for equations, not prose). After each line that uses a sheet item, add a reference line:
```
      ← מדף הנוסחאות [23], עמ׳ 5, סעיף 5.7:   A, B בנות מניה ⇒ A × B בת מניה
```
End with ∎. Use plain Unicode math (ℵ₀, ⊆, ⟹, ∈, ℚ, subscripts and superscripts), because these are pasted into Word. Style the `pre` with `unicode-bidi: plaintext` so Hebrew lines run right-to-left and equation lines left-to-right. The copy button calls `navigator.clipboard.writeText` inside the click handler, catches rejection, and falls back to selecting the text plus a message to press Ctrl+C.

**Demos.** One per part where a picture or interaction shows the mechanism, using vanilla JS, with no libraries needed. Make each one specific to that question, never generic. Patterns that worked:
- an encoding: clickable digits/bits showing the set ↔ number correspondence;
- diagonal enumeration of a grid with a "נגן" button, for countable unions;
- revealing algebra steps one at a time (`.stp.off` with a CSS transition) plus a numeric check;
- an SVG plane where the student adds disjoint disks and a rational point is chosen in each, with the coordinates listed;
- toggling bits of g against f₀ to show that a finite set D(g) determines g;
- a slider for n showing both sides of an identity, with proportional bars;
- inputs for initial terms that generate a recursive sequence and color rational vs irrational terms.

Everything is visible at rest: demos render a meaningful initial state, never an empty shell.

**Design.** Light and dark tokens on `:root`, overridden under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`. Previous palette: bg #f3f5f8, surface #fff, fg #13202d, muted #57677a, line #d5dde6, accent #2447c9, ok #0f7a4d, warn #9a5b00, hl #ffe680, hl-badge #2447c9. Dark: bg #0e1419, surface #151d25, fg #e5ecf3, accent #8aa4ff, hl #5a4a0f. Fonts from Google Fonts: Rubik (headings), Assistant (body), STIX Two Text (math), each with fallbacks. Single column, max width about 780px, 16px side gutter, `<title>` like "פתרון מטלה 03 בדידה". Load the `artifact-design` skill before writing the page if it isn't loaded yet.

**Math inside Hebrew (bidi) rules.** These matter; breaking them scrambles formulas.
- Math spans: `.m{font-family:var(--f-math);direction:ltr;unicode-bidi:isolate;white-space:nowrap}`. Keep them nowrap. Letting an isolated LTR run wrap inside an RTL line scrambles its order.
- A long equation chain goes in a block span (`$$…$$` → `.mb`, display block, `overflow-x:auto`), not inline.
- Don't put two math runs next to each other separated only by ";" or ",". Put Hebrew words between them, or merge them into one run.
- Don't put Hebrew inside a math span (for example the final answer "2^ℵ (בדף: ℵ′)" is `$2^ℵ$ (בדף הנוסחאות: $ℵ′$)`).
- In DejaVu fonts the ℵ glyph looks like the Hebrew letter א, so "2^ℵ" can *look* reversed when it isn't. Check the codepoints (U+2135) and compare against a known LTR line before "fixing" anything.

## Step 6. Practice page

A separate artifact ("תרגול עצמאי בדידה") with new exercises on the same skills, four activities and a sticky progress strip:
1. **Classification quiz**: about 10 items (for example "מה העוצמה?" with options סופית / ℵ₀ / ℵ / 2^ℵ), each with an explanation after answering. Pass mark 8/10.
2. **Order the proof**: shuffled sentences of a proof with the same structure as one of the assignment questions, plus one plausible wrong sentence. Clicking out of order shakes and explains; correct clicks build the proof with a short "why" under each line.
3. **Fill the gaps**: an induction (or calculation) proof with `<select>` blanks, a check button and a hint.
4. **Write it yourself**: a textarea, three graded hints, and a model solution that opens only after about 60 characters of attempt or all three hints. Then a self-check rubric of about 5 checkboxes.

End with a summary that tells the student whether they're ready and which question in the solution page to revisit for each weak area. Make the tasks genuinely new, close cousins of the assignment questions. Verify each exercise's correct answer yourself.

## Step 7. PDFs

**Find formula coordinates on the sheet** (pdfplumber, top-left origin, points):
```python
import pdfplumber, sys
pg=int(sys.argv[1])  # PDF page number
with pdfplumber.open('cheat.pdf') as pdf:
    p=pdf.pages[pg-1]; rows={}
    for w in p.extract_words():
        rows.setdefault((round(w['top']/4), 0 if w['x0']>p.width/2 else 1),[]).append(w)
    for k in sorted(rows,key=lambda k:(k[1],k[0])):
        r=rows[k]; print('R' if k[1]==0 else 'L', f"y={min(w['top'] for w in r):.1f}-{max(w['bottom'] for w in r):.1f} x={min(w['x0'] for w in r):.1f}-{max(w['x1'] for w in r):.1f} |", ' '.join(w['text'] for w in r)[:100])
```
Hebrew words print reversed, but math and numbers are readable enough to locate lines. The sheet uses two columns, with a formula sub-column on the left of the right column. Pick boxes per item, then render the result and **look at it**.

**Highlighted sheet.** Draw a 12-page reportlab overlay (A4 595.32×841.92; y = H − bottom): a yellow rounded rect (fill alpha about 0.38, amber stroke) per box, plus a blue numbered circle outside the box, on the right for right-column items and on the left for left-column items. Then:
```bash
qpdf cheat.pdf --overlay overlay.pdf -- cheat-sheet-highlighted.pdf
```
Don't use pypdf `merge_page` on this file, because it corrupts the content streams and produces blank pages. Use tighter padding where boxes are adjacent so they don't overlap. Render the marked pages (`pdftoppm -r 120 -jpeg -jpegopt quality=78 -f N -l N`) to embed in the solution page.

**answers.pdf.** Write a small RTL HTML file (DejaVu Sans, A4, `@page{margin:14mm 12mm}`): page 1 has a table סעיף | תשובה סופית | הרעיון בקצרה | מדף הנוסחאות, with notation notes in the subtitle so the table doesn't spill onto a nearly empty page. Page 2 is the legend table מס׳ | הנוסחה | מקום בדף | בשימוש בסעיפים. Print with Chromium, not wkhtmltopdf, whose bidi handling is unreliable:
```bash
/opt/pw-browsers/chromium-*/chrome-linux/chrome --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf=front.pdf file:///path/answers.html
qpdf --empty --pages front.pdf cheat-sheet-highlighted.pdf 6,5,3 -- answers.pdf   # marked pages, most-used first
```

## Step 8. Check

- `node --check` on every inline script (extract with a regex).
- Overflow probe: open the page in headless Chromium at a phone width. Its minimum layout width is about 485px, so compare `scrollWidth` with `clientWidth` rather than trusting a cropped screenshot. List elements whose box exceeds the viewport, skipping the nav and `.scroll` containers. Then take one full-page screenshot and look at the summary table, a few steps with tags, one copy box and the cheat-sheet section.
- Render page 1 and 2 of answers.pdf and the marked sheet pages, and look at them, zooming into a cell or two.
- Fix what you find, and re-check once.

## Step 9. Publish and report

Publish both pages with the Artifact tool (icons "book" and "quiz") and send both PDFs with SendUserFile. The final message is short: what was produced, what you verified and how, any reasoning you corrected, and one suggested next step (usually "start with activity 4 on the practice page"). Remind the student, in one line, to write the submission in their own words and be able to explain every step. Don't paste URLs; the cards carry them. Update an existing artifact (same file path or its `url`) when the user asks for changes, rather than creating a new one.

## Writing for this student

- Simple, short Hebrew sentences; define notation the first time (נסמן: …).
- Every step says *what* and *why*, with the why as a cited sheet item whenever possible.
- In copy texts, equations carry the argument; prose only connects them.
- "הרעיון בקצרה" is one everyday-language sentence (an analogy is fine: "כמו דומינו").
- Avoid jargon the course doesn't use. Use the course's terms: בת מניה, חח״ע, על, קש״ב, עוצמת הרצף.

---

## Cheat-sheet index (נוסחאון 20476, printed page → content)

Printed page N = PDF page N+1. Section numbers as printed.

**עמ׳ 1, לוגיקה**
- 1.1 truth tables: ¬, ∧, ∨, →, ↔, NAND (↑), NOR (↓), XOR (+); tautology T, contradiction F.
- 1.2 equivalences: double negation, commutative, associative, distributive, De Morgan, contrapositive p→q ≡ ¬q→¬p, identity, domination, idempotent. Expressing →: p→q ≡ ¬p∨q, p∨q ≡ ¬p→q, p∧q ≡ ¬(p→¬q), (p→q)∧(p→r) ≡ p→(q∧r), (p→r)∧(q→r) ≡ (p∨q)→r, and similar. Expressing ↔: (p→q)∧(q→p), ¬p↔¬q, (p∧q)∨(¬p∧¬q), ¬(p↔q) ≡ p↔¬q. Quantifiers: ¬∀x p(x) ≡ ∃x ¬p(x), ¬∃x p(x) ≡ ∀x ¬p(x); negation table (לכל ↔ קיים, ≥ ↔ <). Tautological equivalence and tautological implication.
- 1.3 rules of inference: Modus Ponens, Modus Tollens, Associative, Commutative, Biconditional, Exportation, Contraposition, Hypothetical Syllogism, Material Implication, Distributive, Absorption, Disjunctive Syllogism, Addition, Simplification, Conjunction, Double Negation, Disjunctive Simplification, Resolution.

**עמ׳ 2, תורת הקבוצות**
- 2.1 ∈, ∉; A ⊆ B ⇔ ∀x(x∈A → x∈B); proper subset A ⊂ B (also ∃x∈B, x∉A).
- 2.2 ∅ ⊆ A; P(A) = {X | X ⊆ A}; P(∅) = {∅}; A ∈ P(A); **|A| = n ⇒ |P(A)| = 2ⁿ**; A infinite ⇒ P(A) infinite.
- 2.3 union, intersection, difference, symmetric difference, complement: definitions with Venn diagrams; commutative, associative, idempotent laws; A ⊆ B ⇔ A∪B = B ⇔ A∩B = A; A∪B ⊆ C ⇔ A⊆C and B⊆C; C ⊆ A∩B ⇔ C⊆A and C⊆B; Theorem 1.24: A∖B = A∩Bᶜ; Q42: A∖B = Bᶜ∖Aᶜ; AΔB = (A∪B)∖(A∩B) = (A∖B)∪(B∖A), commutative and associative; Q31: AΔ∅ = A, AΔA = ∅; Q38: AΔU = Aᶜ, AΔAᶜ = U; Q43: (AΔB)ᶜ = AΔBᶜ = AᶜΔB.
- 2.4 De Morgan for sets, (Aᶜ)ᶜ = A, Uᶜ = ∅, ∅ᶜ = U, A∪Aᶜ = U, A∩Aᶜ = ∅, distributive laws, (A∖B)∪(B∖A) = (A∪B)∖(A∩B).
- 2.5 indexed unions and intersections ⋃_{α∈Γ} A_α, ⋂_{α∈Γ} A_α; Theorem 1.28: A_{α₀} ⊆ ⋃A_α, ⋂A_α ⊆ A_{α₀}; Theorem 1.29 (distributive): B ∩ ⋃A_α = ⋃(B∩A_α), B ∪ ⋂A_α = ⋂(B∪A_α).

**עמ׳ 3, יחסים**
- 3.1 Cartesian product A×B = {(a,b) | a∈A, b∈B}; Theorem 2.3: × distributes over ∪, ∩, ∖ on both sides; Q3: A×B = ∅ ⇔ A = ∅ or B = ∅; a relation R ⊆ A×B, a relation on A is R ⊆ A×A.
- 3.2 empty relation, full relation A×B, identity I_A = {(a,a) | a∈A}, inverse R⁻¹ = {(b,a) | (a,b)∈R}.
- 3.3 reflexive (∀a (a,a)∈R, i.e. I_A ⊆ R); anti-reflexive; symmetric (R = R⁻¹); anti-symmetric ((a,b),(b,a)∈R ⇒ a = b; the sheet's note on the strict/wide sense); transitive; tip for relations defined by a condition: (a,b)∈R ⇔ condition.
- 3.4 equivalence relation (reflexive, symmetric, transitive); partition (pairwise disjoint, union is A); the claim linking equivalence relations and partitions; class [a]_R = {b∈A | aRb}; quotient set A/R, index (number of classes).
- 3.5 orders: weak (חלש: reflexive, anti-symmetric, transitive), strict (חזק: anti-reflexive, transitive), partial, total (מלא: all pairs comparable).
- 3.6 first, last, minimal and maximal elements; their relations (first ⇒ unique minimal; in a total order minimal ⇔ first); a finite nonempty partially ordered set has minimal and maximal elements.

**עמ׳ 4, פונקציות והוכחות**
- 4.1 a function as a triple ⟨A,B,g⟩ (every x has exactly one y); domain, codomain, graph; image f(C) = {f(x) | x∈C}; preimage f⁻¹(D) = {x∈A | f(x)∈D}; identity function; constant function; f[X] ⊆ B, f⁻¹[Y] ⊆ A; composition (f∘g)(x) = f(g(x)).
- 4.2 **mathematical induction** (base for 0, induction hypothesis, step, conclusion "for every n∈ℕ"); number of onto functions from |A| = n to |B| = k: Σᵢ₌₀ᵏ (−1)ⁱ C(k,i)(k−i)ⁿ; arithmetic series aₙ = a₁+(n−1)d, Sₙ = n(a₁+aₙ)/2; geometric aₙ = a₁qⁿ⁻¹, Sₙ = a₁(qⁿ−1)/(q−1); quadratic formula.
- 4.3 **one-to-one (חח״ע)**: x₁ ≠ x₂ ⇒ f(x₁) ≠ f(x₂), equivalently f(x₁) = f(x₂) ⇒ x₁ = x₂.
- 4.4 **onto (על)**: ∀y∈B ∃x∈A f(x) = y; negation of onto.
- 4.5 good to know: prime numbers (definition with De Morgan, list up to 97); polynomial division example (1−x⁶) = (1−x²)(1+x²+x⁴); Archimedean property (every real has a larger natural); corollaries: ∀c>0 ∃n 1/n < c; ∀a,b>0 ∃n na > b.

**עמ׳ 5, עוצמות**
- 5.1 bijection ⇒ |A| = |B| (A ~ B); one-to-one A→B ⇒ |A| ≤ |B|; onto A→B ⇒ |A| ≥ |B|; A ⊆ B ⇒ |A| ≤ |B|; |A| ≤ |B| ⇔ A is equivalent to a subset of B; finite sets: A ⊂ B ⇒ |A| < |B|; Bᴬ is the set of functions A→B, |Bᴬ| = |B|^|A|; Theorem 4.42: |P(A)| = 2^|A|; Theorem 4.43: k < 2ᵏ; countable = finite or equivalent to ℕ, |ℕ| = |ℤ| = |ℚ| = ℵ₀, |∅| = 0; every subset of a countable set is countable; every infinite set has a subset of cardinality ℵ₀ (|A| ≥ ℵ₀); an uncountable set is infinite and not equivalent to ℕ; |ℝ| = |ℝ∖ℚ| = ℚᶜ = ℵ; ℝ is not countable; |ℝ∖(0,1)| = |ℝ∖ℕ| = ℵ; every interval in ℝ has cardinality ℵ.
- 5.2 computation examples: ℵ·ℵ = 2^ℵ₀·2^ℵ₀ = 2^ℵ₀ = ℵ (so ℵ = 2^ℵ₀); 4^ℵ₀ = ℵ; 3^ℵ₀ = ℵ (by קש״ב); ℵ^ℵ₀ = ℵ; ℵ₀^ℵ₀ = ℵ; n^ℵ₀ = ℵ for n ≥ 2; ℵ^ℵ = 2^ℵ = ℵ′; ℵ₀^ℵ = 2^ℵ = ℵ′; |{f | f: ℕ→ℕ}| = |ℕᴺ| = ℵ₀^ℵ₀ = ℵ; |ℝᴺ| = ℵ^ℵ₀ = ℵ.
- 5.3 |A×B| = |A|·|B|; κ·1 = κ, κ·0 = 0; ℵ₀·ℵ₀ = ℵ₀; ℵ·ℵ = ℵ; Q38: 1 ≤ κ ≤ ℵ₀ ⇒ ℵ₀·κ = ℵ₀, and 1 ≤ κ ≤ ℵ ⇒ ℵ·κ = ℵ.
- 5.4 A, B disjoint ⇒ |A∪B| = |A|+|B|; κ+0 = κ; ℵ₀+1 = ℵ₀; ℵ₀+ℵ₀ = ℵ₀; ℵ+ℵ = ℵ; κ infinite ⇒ κ+ℵ₀ = κ.
- 5.5 power laws: (|A|·|B|)^|C| = |A|^|C|·|B|^|C|; |A|^(|B|+|C|) = |A|^|B|·|A|^|C|; (|A|^|B|)^|C| = |A|^(|B|·|C|); |A| ≤ |B| ⇒ |A|^|C| ≤ |B|^|C| and |C|^|A| ≤ |C|^|B|.
- 5.6 קש״ב: λ ≤ μ and μ ≤ λ ⇒ λ = μ; Cantor: |P(A)| > |A|; density: ℚ is dense in ℝ (every open interval contains a rational).
- 5.7 order of cardinalities: finite < ℵ₀ < ℵ < ℵ′; the intersection of two sets, at least one countable, is countable; A countable ⇒ A∖B countable; a finite union of countable sets is countable; ⋃ₙ₌₀^∞ Aₙ with every Aₙ countable is countable; A, B countable ⇒ A×B countable; f: A→B onto and A countable ⇒ B countable; f: A→B one-to-one and B countable ⇒ A countable; A uncountable and B ⊆ A countable ⇒ A∖B uncountable.
- 5.8 number sets: ℕ = {0,1,2,…} (0 is a natural, even number in the course), ℤ, ℚ = {m/n | m,n∈ℤ, n≠0}, ℝ∖ℚ (ln2, √2, √3, e, π…), ℝ = ℚ ∪ (ℝ∖ℚ).

**עמ׳ 6, קומבינטוריקה**
- 6.1 inclusion–exclusion: |A₁∪A₂∪A₃| formula; S₀ = |U|, Sₖ = Σ over k-intersections; |A₁∪…∪Aₙ| = S₁ − S₂ + S₃ − … + (−1)ⁿ⁻¹Sₙ; complement form |U − A₁∪…∪Aₙ| = S₀ − S₁ + S₂ − … + (−1)ⁿSₙ.
- 6.2 Pascal: C(n,k) = C(n−1,k−1) + C(n−1,k); C(n,k) = C(n,n−k); C(n,0) = C(n,n) = 1.
- 6.3 generating functions: Σ λᵏxᵏ = 1/(1−λx); finite geometric Σₖ₌₀ⁿ xᵏ = (1−xⁿ⁺¹)/(1−x); Σ C(n,k)xᵏ = (1+x)ⁿ; binomial Σ C(n,k)xᵏaⁿ⁻ᵏ = (x+a)ⁿ and the (a−x)ⁿ version; negative binomial Σ D(n,k)xᵏ = 1/(1−x)ⁿ; multinomial expansion; product of series cₖ = Σᵢ aᵢbₖ₋ᵢ; examples Σ x³ᵏ = 1/(1−x³), Σ C(n,k)(−1)ᵏx²ᵏ = (1−x²)ⁿ.
- 6.4 addition and multiplication principles; pigeonhole (at least ⌈n/m⌉ in one box); permutations P(n) = n!; permutations with repetition n!/(k₁!⋯kₘ!); arrangements P(n,k) = n!/(n−k)!; arrangements with repetition nᵏ; combinations C(n,k) = n!/((n−k)!k!); combinations with repetition D(n,k) = C(n−1+k, k) = C(n−1+k, n−1).
- 6.5 linear recursion aₙ = c₁aₙ₋₁ + c₂aₙ₋₂: substitute λⁿ, characteristic equation λ² − c₁λ − c₂ = 0; distinct roots aₙ = Aλ₁ⁿ + Bλ₂ⁿ; double root aₙ = Aλⁿ + Bnλⁿ; find A, B from initial conditions.

**עמ׳ 7, תורת הגרפים** (numbered table)
- 1.1 graph G = (V,E), vertex, edge, simple graph, degree deg(v) (a loop counts twice), isolated vertex.
- 1.3 Σ deg(v) = 2|E|; the number of odd-degree vertices is even; path, length |P|, closed path/cycle, simple path, simple cycle.
- connected graph, connected components.
- 1.4 complete graph Kₙ with n(n−1)/2 edges; complement graph; cycle graph Cₙ.
- 1.5 bipartite graph; complete bipartite K_{p,q} with p·q edges.
- 1.6 a graph with at least 2 vertices is bipartite ⇔ it has no odd cycle.

**עמ׳ 8, עצים ופרופר**
- 2.1 forest, tree (connected, no cycles). 2.2 leaf (degree 1).
- 2.5 equivalent conditions for a tree: unique path between any two vertices; minimally connected; connected with |E| = |V|−1; acyclic with |E| = |V|−1; maximally acyclic. A forest with k components has |E| = |V|−k.
- Q3 p.21: every tree with at least 2 vertices has at least two leaves.
- 2.6 spanning tree. 2.7 isomorphism (u~v ⇔ f(u)~f(v)). 2.8 isomorphism of labeled graphs.
- 2.9 Cayley: nⁿ⁻² labeled trees on n vertices (also the number of spanning trees of Kₙ).
- Prüfer sequence: length n−2, bijection between labeled trees and sequences in {1,…,n}ⁿ⁻²; how to build the sequence from a tree.

**עמ׳ 9, פרופר, אוילר, המילטון, זיווג**
- building the tree from a Prüfer sequence (a label appearing x times has degree x+1; leaves don't appear).
- 3 Euler path/cycle (every edge once), Hamilton path/cycle (every vertex once).
- 3.1 a connected graph is Eulerian ⇔ all degrees are even; Q1 p.37: a connected graph has an Euler path that isn't a cycle ⇔ exactly 2 odd-degree vertices; d-regular graph.
- 3.2 Ore: simple, n ≥ 3, deg(u)+deg(v) ≥ n for non-adjacent u, v ⇒ Hamiltonian. 3.3 Dirac: deg(v) ≥ n/2 ⇒ Hamiltonian; addition: deg(v) ≥ (n−1)/2 ⇒ Hamilton path.
- Q7 p.42: K_{p,q} is Hamiltonian ⇔ p = q ≥ 2. Cut vertex (a graph with one is not Hamiltonian).
- 4.1 matching; maximum matching; 4.3 perfect matching |M| = |V|/2 (possible only if |V| is even).

**עמ׳ 10, זיווג ומישוריות**
- number of perfect matchings in K₂ₙ: (2n)!/(2ⁿn!).
- alternating path, augmenting path; 4.6 Berge: M is maximum ⇔ there is no augmenting path.
- Γ(X) neighbour set; 4.7 Hall: a bipartite (A∪B, E) has a matching saturating A ⇔ |Γ(X)| ≥ |X| for every X ⊆ A; 4.8 perfect matching when |A| = |B| and Hall's condition holds.
- 5.1 planar graph, faces (the outer one too); 5.3 Euler's formula for a connected planar graph: f = m − n + 2 (f = |E| − |V| + 2).
- 5.4 simple planar with n ≥ 3: m ≤ 3n−6, so K₅ isn't planar; Q3 p.61: simple connected bipartite planar with n ≥ 3: m ≤ 2n−4, so K₃,₃ isn't planar.

**עמ׳ 11, מישוריות וצביעה**
- 5.6 subdivision; 5.7 G is planar ⇔ every subdivision of it is planar; 5.8 Kuratowski: planar ⇔ no subgraph that is a subdivision of K₅ or K₃,₃.
- 6.1 proper vertex coloring, chromatic number χ(G), k-colorable; χ(Kₙ) = n; χ(G) = 2 ⇔ bipartite with at least one edge; cycle: even ⇒ 2, odd ⇒ 3.
- 6.2 χ(G) ≤ Δ(G)+1; Brooks: χ(G) ≤ Δ(G) except a complete graph K_{Δ+1} component or Δ = 2 with an odd cycle component.
- 6.3 four color theorem: planar ⇒ χ ≤ 4. 6.4 five color theorem: planar ⇒ χ ≤ 5.

For assignments in other courses, the same workflow applies, but ask the user for that course's formula sheet. This index and the stored PDF cover 20476 only.