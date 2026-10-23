# Checking answers well

A study tool that marks a right answer wrong, or a wrong answer right, teaches the wrong thing. The checks below
are what made the 20277 path trustworthy. Use them for any course.

## Executable answers (SQL, relational algebra)

- **Run it.** The 20277 kit has an in-browser SQL engine (correlated subqueries, `>= all`, `count(distinct)`,
  `date_part`, `current_date`, quoted `"User"`, Hebrew literals) and an RA engine (σ π ⋈ ⋈[θ] × ∪ ∩ − ÷ ρ ←).
  Identifiers are lowercased, so store table keys in lowercase and display the exam's names.
- **Push predicates down.** A naive FROM builds the cross product first: 4 tables took 4.7 s. Applying each
  top-level `AND` conjunct as soon as its tables are joined took 6 ms. Subquery conjuncts run last.
- **Two datasets per schema.** A is shown and runnable; B is hidden. The message for "right on A, wrong on B" is
  its own feedback: the query works here by chance, so look for an edge case (ties, empty groups, partial
  matches).
- **Seeded generators per schema, with planted edge cases** (a store that copies Y's titles, another missing one
  title, ties at the maximum). Generate dates relative to today, so date-relative questions stay valid.
- **Seed search with mutation testing.** For each schema, find seeds where:
  - every reference result is non-empty on both datasets, and the reference passes the real checker;
  - every wrong variant gives a different result from the reference on A or B.

  Store the seeds. In the 20277 bank, every wrong variant is also matched back to its explanation.
- **The wrong-variant library** is the most valuable content. Take it from:
  - grader marks in scanned notebooks (e.g. "missing group by in the subquery, −3");
  - errors in official proposed solutions (e.g. Memvote instead of Sponsor, a `before` trigger counting 119);
  - the classic confusions: count(*) vs count(distinct); "only" without `exists`; "never" checked on a single
    row; the subquery missing the outer conditions.
- **Rules of the exam.** Flag operations outside the course's allowed list as wrong-for-the-exam, even when
  the result is right: limit, join … on, extract, coalesce, is null, and order by when sorting wasn't asked.
  Allow `with` when the exam allows it.
- **Compare as sets of rows**, ignoring column order inside a row. Report a duplicates-only difference as
  "missing distinct?". A column-count mismatch gets its own message.

## Generated problems

- Each generator returns problems whose own solution passes its own checker. Test this over 60 or more seeds per
  skill, and print the answer distribution.
- **Calibrate the distribution deliberately.** Draw the target answer once per problem *before* the rejection
  loop. Drawing it inside the loop biases toward whatever random instances produce most (for normalization, "not
  3NF" in 50 of 60). Warm up the PRNG: the first xorshift outputs from small seeds are correlated.
- **Validate against real exams.** The normalization algorithms reproduce the keys, canonical covers, normal
  forms, lossless and dependency-preservation verdicts, and 3NF syntheses of 10 real exams, and accept every
  valid alternative cover or decomposition. The B+ insertion matched the original engine on 400 random runs.
- **Many correct answers**: check properties, not equality. Canonical cover = equivalent to F, with no
  extraneous attribute, no redundant FD and no duplicate left-hand side. Decomposition = covers R, passes the
  chase test, preserves dependencies, and every table is at least 3NF. If BCNF was asked and the synthesis
  reaches BCNF, a 3NF-only answer is wrong.
- **Buggy-algorithm distractors** (B+): run the same insertions with one known bug each: the middle key moved
  instead of copied, an internal split keeping the key, a missing internal split, a floor/ceil leaf split. Show
  the resulting trees as options. Picking one gives that bug's explanation. Guard navigation, because buggy trees
  can be malformed.
- **Numeric answers**: accept ±max(1, 2%) when the course rounds (size estimation), and show the exact value in
  the note.

## Statements and multiple choice

- Real true/false statements stay attached to their diagram. Map multi-version questions by their prefix
  ("גרסה 2", "א:"). Drop statements you can't map rather than guess.
- Shuffle the options, except true/false and ordered scales.
