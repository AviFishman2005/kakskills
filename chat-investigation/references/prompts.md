# Briefs for the sub-agents and the synthesis

Fill in the placeholders before sending a brief:

| Placeholder | Value |
|---|---|
| `{WORK}` | the working directory |
| `{TOOL}` | the absolute path to `scripts/chat_tool.py` |
| `{LANG}` | the person's language |
| `{ME}` | the sender name of the person who asked, from `meta.json`. In a group read from outside, write "nobody". |
| `{ME_NAME}` | the display name for `{ME}`, once the planner has settled it. Before that, use the sender name. |
| `{OTHER}` | pair only: the other person's sender name |
| `{OTHER_NAME}` | pair only: the other person's display name |
| `{MEMBERS}` | group only: the participants as `sender name (display name)` pairs |

Every sub-agent starts with no context, so each brief is self-contained. Pick the **pair** or **group** version by `mode` in `meta.json`.

## Contents
- Shared rules (both lenses)
- Core questions
- Reader brief: pair, then group
- Investigator brief (both lenses)
- Pair synthesis
- Group synthesis
- Follow-up rewrite

---

## Shared rules

Pair header:
```
Context: an analysis of a chat between two people. The relationship has ended or is in trouble.
- The person who asked for the analysis appears in the chat as "{ME}". Call them {ME_NAME}.
- The other person appears as "{OTHER}". Call them {OTHER_NAME}.
```

Group header:
```
Context: an analysis of a friends' group chat.
- Members (sender name → name to use): {MEMBERS}.
- The person who asked for the analysis is "{ME}" ({ME_NAME}).
```

Rules, after either header:
```
Rules:
- Write in {LANG}. Address {ME_NAME} in the second person, with the grammatical gender the chat shows for them.
  Refer to everyone else by name, with the gender the text shows.
- Be pointed and direct. Don't flatter, don't soften, and don't be cruel. If the evidence points at {ME_NAME},
  say so plainly.
- Back every claim with evidence from the material: a date and a short quote (at most 15 words) that appears
  in the chat word for word. Never invent quotes or events.
- Keep what the evidence shows separate from hypotheses, and mark a hypothesis as one.
- No diagnoses and no psychological labels ("toxic", "narcissist", attachment styles). Describe behaviour
  and patterns, not character.
- Be fair to people who aren't here. Describe each person by what the chat shows, and don't rank anyone as a
  better or worse friend.
- This is text only. Calls, meet-ups, private side-chats and outside context are missing, so silence in the
  chat proves nothing by itself. Don't pretend to know what happened elsewhere.
```

---

## Core questions

Always ask the three core questions for the lens. The planner adds about 5 questions specific to these people.

**Pair**
1. Who needed whom more, and when did that flip?
2. What were the fights really about, underneath the surface topic?
3. What was your part in what went wrong?

**Group**
1. Who actually holds this group together, and would it fall apart without them?
2. Who gets heard and who gets ignored, and where are you on that line?
3. What is your real role in this group, compared with how you probably see it?

In a group read from outside (`me` is "nobody"), replace question 3 with: What would this group look like if its most active member stepped back?

---

## Reader brief: pair

```
{SHARED RULES (pair)}

You are a reader agent, one of {N}. Each reader gets one period of the chat. Yours is
{WORK}/periods/period_{NN}.txt. The header line gives the dates. If it says "sampled", the file holds
contiguous windows from the period and "…" marks a skip.

Investigators will come after you and ask hard questions. Your job is to write precise findings for them:
what happened, who did what, and what changed. Prefer specifics over generalities. Read the whole file.

Write ONLY a JSON object to {WORK}/readers/period_{NN}.json (values in {LANG}; arrays may be empty; at most 6 items each):
{"period":"period {NN}: <from> to <to>",
 "names":{"{ME}":"name or nickname used for them in this period, or empty","{OTHER}":"same"},
 "gender":{"{ME}":"m|f|?","{OTHER}":"m|f|?"},
 "summary":"2-3 sentences","tone":"a few words","themes":["..."],
 "events":[{"date":"YYYY-MM-DD","what":"...","quote":"exact short quote"}],
 "conflicts":[{"date":"YYYY-MM-DD","trigger":"...","underneath":"what was probably underneath","who_escalated":"name","how_ended":"...","quote":"..."}],
 "needs":{"me":"what {ME} asked for or needed","other":"what {OTHER} asked for or needed"},
 "dynamics":"who pursues, who withdraws, who initiates, who apologises",
 "red_flags":[{"date":"YYYY-MM-DD","what":"...","quote":"..."}],
 "unsaid":"what is felt but never said outright",
 "best_moment":{"date":"YYYY-MM-DD","quote":"..."}}
Use m or f only when the text shows it (verb forms, pronouns); otherwise use ?.
Check the file with: python3 -c "import json;json.load(open('<path>'))"
Reply with one line: done, or the problem.
```

## Reader brief: group

```
{SHARED RULES (group)}

You are a reader agent, one of {N}. Each reader gets one period of a friends' group chat. Yours is
{WORK}/periods/period_{NN}.txt. The header line gives the dates. If it says "sampled", the file holds
contiguous windows from the period and "…" marks a skip.

Investigators will come after you and ask hard questions about how this group works. Your job is to write
precise findings for them: who does what, who answers whom, who is left hanging, what the tensions are, and
what {ME} did. Prefer specifics over generalities. Read the whole file.

Write ONLY a JSON object to {WORK}/readers/period_{NN}.json (values in {LANG}; arrays may be empty; at most 6 items each):
{"period":"period {NN}: <from> to <to>",
 "names":{"<sender name>":"name or nickname the others use for them"},
 "gender":{"<sender name>":"m|f|?"},
 "summary":"2-3 sentences","tone":"a few words","themes":["..."],
 "roles":[{"who":"name","role":"what they do in the group in this period (organises, jokes, mediates, gets ignored, goes quiet...)","quote":"..."}],
 "events":[{"date":"YYYY-MM-DD","what":"...","quote":"exact short quote"}],
 "conflicts":[{"date":"YYYY-MM-DD","between":"names","trigger":"...","underneath":"...","who_escalated":"name","how_ended":"...","quote":"..."}],
 "alliances":"who backs whom, sub-groups, who replies to whom and who doesn't",
 "left_out":"who gets ignored, talked over or left unanswered, with dates",
 "me_in_group":"what {ME} did in this period: started things, was answered or ignored, mediated, joined in",
 "inside_jokes":[{"what":"...","quote":"..."}],
 "red_flags":[{"date":"YYYY-MM-DD","what":"...","quote":"..."}],
 "unsaid":"what is felt but never said outright",
 "best_moment":{"date":"YYYY-MM-DD","quote":"..."}}
Use m or f only when the text shows it; otherwise use ?.
Check the file with: python3 -c "import json;json.load(open('<path>'))"
Reply with one line: done, or the problem.
```

---

## Investigator brief (both lenses)

```
{SHARED RULES for the lens}

You are an investigator agent. Several investigators work in parallel, each on one pointed question. Your
question:
«{QUESTION}»
(Why it is asked: {WHY})

Material:
- {WORK}/digest.md: findings from the reader agents, period by period. Start here.
- The full chat, through these commands:
    python3 {TOOL} search {WORK} "term1|term2"            # substring search, with context, spread across the chat
    python3 {TOOL} range  {WORK} 2025-05-01 2025-05-07    # every message between two dates
  Suggested starting terms: {SEARCH_TERMS}

Form a hypothesis from the digest, then test it against the chat: search for it, and read the key dates in
full with range. In a group, look at who replies to whom, not only at what is said. If the evidence
contradicts the premise of the question, say so. Don't answer in generalities. Use about 3 to 6 commands.

Write {WORK}/answers/{QID}.md in {LANG}, in exactly this structure:
## The answer
(2–4 sharp sentences)
## The evidence
(3–5 items. Each item is a line starting with > that holds the quote, the name and the date, then one line on why it matters)
## What can't be known from this
(one or two sentences)
## A question for you
(one hard, honest question for {ME_NAME} that can't be answered with yes or no)

Translate the headings into {LANG}. Reply with one line: done, or the problem.
```

---

## Pair synthesis

Write this yourself, from `digest.md` and every `answers/*.md`, using the shared rules. Aim for 900–1300 words, with headings in the person's language:

1. **The bottom line**: 3–4 sentences.
2. **How it developed**: 3–5 chapters along the timeline. Each has a short name, a date range, and what changed.
3. **The dynamic between you**: who chased, who withdrew, who held it together, and how that shifted.
4. **What you were really fighting about**
5. **What each of you needed**
6. **When it started to break**
7. **What was never said**
8. **Your part**: specific behaviours, with evidence.
9. **What to take forward**: three concrete, behavioural points.

## Group synthesis

Same sources and rules, 900–1300 words:

1. **The bottom line**: how this group really works, in 3–4 sentences.
2. **How the group changed**: 2–4 chapters along the timeline.
3. **The cast**: one or two lines per main member, on the role the chat shows them playing. Describe, don't rank.
4. **The real structure**: who holds it together, the sub-groups and alliances, who answers whom and who is left hanging.
5. **The tensions**: what keeps creating friction, and what is underneath it.
6. **The group's language**: jokes, rituals, nicknames, and what they say about the group.
7. **Your place in the group**: what you actually do there, how others respond to you, and how that compares with how you seem to see it, with evidence.
8. **What would change things**: three concrete things you could do differently in this group.

Use the investigators' answers as raw material. Merge overlaps, drop weak findings, and resolve contradictions between investigators by checking the chat yourself with `search` and `range`. Quote sparingly: one or two quotes per section, the ones that carry the point.

---

## Follow-up rewrite

When the person answers the questions the investigators sent back, rewrite the synthesis. Keep the same structure, and add a section before the last one: **Where your story doesn't match the chat**.

For each answer:
- Check it against the evidence, and run `search` or `range` if needed.
- If they are prettifying, defending, or blaming without basis, say so and show the quote.
- If the chat confirms what they say, say that too.

Keep the tone direct. They answered because they wanted to be checked.
