# Reusable engines (no course material)

| File | What | Global |
|---|---|---|
| `path.js`, `path.css` | Learning-path engine and UI (state, sync via `db` + `user`, ladders, scheduling, sessions, player, dashboard). The unit/skill list at the top is the 20277 configuration; replace it for another course. Expects `NORM`, `SQLB`, `RAB`, `GEN` and the page helpers `esc`, `cc`, `vizDiv`, `mountViz`. | `PATH` |
| `norm.js` | Functional dependencies: closure, candidate keys, canonical cover and a property-based cover checker, NF of R, lossless (binary and chase), dependency preservation, projected NF, 3NF synthesis, parsers, an exam-like generator with calibrated answer distributions, step traces in Hebrew, and checkers that explain the specific mistake. Runs in node (`module.exports`). | `NORM` |
| `sql_engine.js` | In-browser SQL (select with correlated subqueries, exists, in, all/any, group by/having, aggregates, distinct, set operations, with, views, insert/update/delete, date_part, current_date) with predicate pushdown. `SQL.Engine(db).exec(src)` where `db = {lowercasename: {cols, rows, pk}}`. | `SQL` |
| `sql_rules.js` | Flags operations outside the course's allowed list: `SQLRULES.check(src, {sortAsked})` returns the keys, and `SQLRULES.msg(keys)` gives Hebrew names. | `SQLRULES` |
| `ra_engine.js` | Relational algebra: σ π ⋈ ⋈[θ] × ∪ ∩ − ÷ ρ, with assignments (←) and step results. `RA.run(src, db)` where `db = {Name: {cols: [{n, r}], rows}}`. | `RA` |

The course-specific parts (exam schemas and seeded data, the exercise banks, the stage-2 modules with real
solutions, and the ER specs of the exam diagrams) are in the private 20277 kit artifact. See
`../../references/course-20277.md`.
