---
name: relationship-chat-investigation
description: >-
  Deep, evidence-based analysis of a relationship from an exported chat (WhatsApp .txt/.zip, Telegram result.json), run as a team of sub-agents: period readers, a planner that writes pointed questions specific to this relationship, investigators that search the full chat for dated quotes, and a final synthesis. Use whenever someone uploads or mentions a chat with an ex, partner, crush, friend or family member and wants to understand what happened, who invested more, why it ended, what they fought about, or what to learn from it, in any language (e.g. "תנתח את הצ'אט שלי עם האקסית", "what went wrong with us"), even if they never say "analysis". Also use when they ask for the "black box" / הקופסה השחורה page or a page where they can upload chats themselves.
---

# Relationship chat investigation

People bring this when a relationship ended or confused them and they want a straight account of what the messages show. Counting messages does not give them that. They need a reading of the actual conversation: what each person needed, what the fights were really about, where it turned, and what part the reader played. So the work is qualitative and grounded in quotes, and its weight goes into the final written analysis, not into statistics.

There are two modes. Pick by what was asked:

- **Run the investigation here** (default): the person gave a chat file and wants it analysed. Follow the pipeline below.
- **Give them the page**: they want a tool to upload chats into themselves. Publish `assets/blackbox.html` (see "The page" at the end).

## The pipeline

Work in a scratch directory, called WORK below. Script: `python3 scripts/chat_tool.py` (paths relative to this skill's directory). Tell the person in one line what is about to happen and roughly how long it takes (a few minutes; about 6–10 reader agents and 8 investigators). Then start; don't ask for approval.

### 1. Parse and identify the two people

```
python3 scripts/chat_tool.py parse "<chat file>" --out WORK
```

It prints `meta.json`: the participants, the date range, and a guess of which one is the person you're talking to (`me`). WhatsApp names the export after the *other* person, and "You deleted this message" lines belong to the exporter. If `me_sure` is false, check the conversation for the person's name; ask only if it's still unclear. If the guess is backwards, run `chat_tool.py swap WORK`.

Sender names are often contact labels ("Noa 💕", "Mom"). The names the analysis uses come from the chat itself: what they call each other, and how they sign. The readers report these names and the planner settles them. Grammatical gender, which matters in Hebrew, also comes from the text.

If there are more than two participants, the pipeline analyses the two main writers. Say so.

### 2. Readers: one sub-agent per period

```
python3 scripts/chat_tool.py periods WORK
```

This splits the two people's messages into 2–10 periods of about 36k characters each (sampled windows when the chat is huge) in `WORK/periods/`. Spawn one reader sub-agent per period, **all in the same turn** so they run in parallel. Each gets the reader brief from `references/prompts.md`, filled in, and writes `WORK/readers/period_NN.json`. Readers keep the investigators from having to read the whole chat. They also catch things that only show up across time: shifts in tone, who started chasing whom, when affection stopped.

When every reader is done:

```
python3 scripts/chat_tool.py digest WORK     # -> WORK/digest.md
```

If a reader failed, re-run that one reader before moving on.

### 3. Planner (do this yourself)

Read `digest.md`. Then:

- Settle the display names and genders.
- Write one sharp sentence on what this relationship was really about.
- Write the questions. Use these three core questions every time:
  1. Who needed whom more, and when did that flip?
  2. What were the fights really about, underneath the surface topic?
  3. What was your part in what went wrong?
- Add about 5 questions that could only be asked about *this* couple. Each one should name the people, the events and the patterns the readers found, and press on what is uncomfortable to look at. Good: "Why did every argument about her parents end with you apologising for something else?" Bad: "How was communication?"
- Give every question 3–6 search terms that actually appear in the messages.

Add any question the person asked for. Doing the planning yourself keeps the questions tied to what you'll synthesise, and it saves a round trip.

### 4. Investigators: one sub-agent per question

Spawn them **in the same turn**, each with the investigator brief from `references/prompts.md`. They read `digest.md`, use `chat_tool.py search` and `range` against the full chat to verify their hypothesis and pull exact quotes, and write `WORK/answers/qNN.md`. Each answer ends with one hard question back to the person. Investigators exist because a single pass over a long chat produces generalities. One agent per question, with search, produces specific dated evidence and can find that the question's premise is wrong.

### 5. Synthesis (do this yourself)

Read all the answers and the digest, then write the analysis using the structure in `references/prompts.md`. This is the deliverable, so it has to stand on its own as a general analysis of the relationship. Don't walk through the questions one by one. Connect the findings, name the central pattern, and say plainly what the reader's part was.

### 6. Deliver

- Put the analysis in the reply, in the person's language (Hebrew chat and Hebrew user means Hebrew).
- After it, list the questions the investigators sent back to them, numbered. Tell them that if they answer, you'll check their account against the chat and rewrite the analysis.
- When they answer, rewrite the synthesis using the follow-up instructions in `references/prompts.md`. Point out where their story doesn't match the messages, and where the messages back them up.

The analysis is personal. Keep it in the reply unless they ask for a document. Don't publish it as an artifact on your own initiative, and don't file details from the chat into memory.

## Ground rules for every agent

They are in the shared rules block in `references/prompts.md`. Pass them to every sub-agent, because each one starts cold. The reasons, so you can apply them with judgement:

- **Every claim cites a date and a short exact quote.** People who have just broken up will test every sentence against their memory. One invented quote discredits everything else.
- **Pointed, not cruel; no flattery.** They came for honesty. Softening wastes their time, and cruelty makes them stop listening.
- **Behaviour, not diagnosis.** Labels like "narcissist" or "anxious attachment" can't be supported from text and they end the conversation. Describe what was done and said.
- **Text only.** Calls, dates and real-life context are missing. Say so once where it matters, not as a blanket disclaimer.
- **Address the reader in second person.** Name the other person; don't call them "the ex" when the chat gives a name.

## Smaller requests

If they ask one focused question ("who chased whom?", "when did it start going wrong?"), skip the readers. Parse the chat, then answer it directly with `search` and `range`, or with one investigator for a long chat. Use the same evidence standard. Offer the full investigation afterwards in one line.

Without a sub-agent tool, run the same stages yourself in sequence. For readers, use `--budget 60000` to get fewer, larger periods.

## The page

`assets/blackbox.html` ("הקופסה השחורה") is the same pipeline as a Hebrew, self-contained page. The person uploads a chat in their browser, and the page runs the readers, planner, investigators and synthesis through Claude on their own account, so nothing is stored. To give it to them, publish the file with the Artifact tool:

- On the first publish, pass `capabilities: {"sample": {}}` and `icon: "chart"`.
- If an earlier conversation already published it, update that artifact rather than making a second copy.

Don't rebuild it from scratch. For changes, copy it to a scratch path, edit it, and publish. The prompts inside it mirror `references/prompts.md`, so change both when you change one.
