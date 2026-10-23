---
name: chat-investigation
description: >-
  Deep, evidence-based analysis of what is really going on in an exported chat (WhatsApp .txt/.zip, Telegram
  result.json), run as a team of sub-agents: period readers, a planner that writes pointed questions specific to
  these people, investigators that search the full chat for dated quotes, and a final synthesis. Works for
  two-person chats (an ex, partner, crush, friend, parent) and for group chats of friends (who holds the group
  together, who gets ignored, the alliances, the tensions, your role). Use whenever someone uploads or mentions a
  chat and wants to understand a relationship or a group: what happened, who invested more, why it ended, what
  the fights were about, why they feel left out, in any language (e.g. "תנתח את הצ'אט שלי עם האקסית", "מה
  הדינמיקה בקבוצה של החבר'ה", "why does everyone ignore me in the group chat"), even if they never say
  "analysis". Also use when they ask for the "black box" / הקופסה השחורה page.
---

# Chat investigation

People bring a chat when something in it confuses or hurts them. It might be a relationship that ended, a friendship that cooled, or a friends' group where they feel sidelined. They want a straight account of what the messages show. Counting messages does not give them that. They need a reading of the actual conversation: who needed what, what the friction was really about, where things turned, and what part they themselves played. So the work is qualitative, grounded in quotes, and its weight goes into the final written analysis.

There are two modes. Pick by what was asked:

- **Run the investigation here** (default): the person gave a chat file and wants it analysed. Follow the pipeline below.
- **Give them the page**: they want a tool to upload chats into themselves. Publish `assets/blackbox.html` (see "The page" at the end).

## Two lenses: a pair or a group

`parse` sets `mode` in `meta.json`. A **group** is three or more people who each wrote a real share of the chat. Everything else is a **pair**.

| | Pair (two people) | Group (friends) |
|---|---|---|
| Central question | What happened between you, and why it went the way it did | How the group really works, and where you stand in it |
| Readers track | needs, fights, who chases or withdraws, warning signs | roles, alliances and sub-groups, who gets answered and who is ignored, tensions, inside jokes, what the user did |
| Synthesis | `references/prompts.md` → Pair synthesis | `references/prompts.md` → Group synthesis |

The pipeline is the same for both. Only the briefs change, and `references/prompts.md` has both versions.

## The pipeline

Work in a scratch directory, called WORK below. Script: `python3 scripts/chat_tool.py` (paths relative to this skill's directory). Tell the person in one line what is about to happen and roughly how long it takes (a few minutes; about 6–10 reader agents and 8 investigators). Then start; don't ask for approval.

### 1. Parse and identify the people

```
python3 scripts/chat_tool.py parse "<chat file>" --out WORK
```

This prints `meta.json` with `mode`, the participants, the date range, and who the person you're talking to (`me`) probably is.

- **Pair:** WhatsApp names the export after the other person, and "You deleted this message" lines belong to the exporter. If the guess is backwards, run `swap WORK`.
- **Group:** the file is named after the group, so only deleted-message lines identify the exporter. If `me` is null and the conversation doesn't tell you which name is theirs, ask. In a group, "your place in it" is the heart of the analysis. Then run `setme WORK "<exact sender name>"`.
- If they want the group analysed from the outside, without a "you", run `setme WORK none`, and replace "your part" sections with an outside view.

Sender names are often contact labels ("Noa 💕", "Mom", a phone number). The names the analysis uses come from the chat itself: what people call each other, and how they sign. The readers report these and you settle them. Grammatical gender, which matters in Hebrew, also comes from the text.

In a group, participants with only a handful of messages are left out of `participants`. Mention them if they matter, for example someone who went silent.

### 2. Readers: one sub-agent per period

```
python3 scripts/chat_tool.py periods WORK
```

This splits the analysed messages into 2–10 periods of about 36k characters each (sampled windows when the chat is huge) in `WORK/periods/`. Spawn one reader sub-agent per period, **all in the same turn** so they run in parallel. Each gets the reader brief for its lens from `references/prompts.md` and writes `WORK/readers/period_NN.json`. Readers keep the investigators from having to read everything. They also catch what only shows up across time: shifts in tone, who started chasing whom, who stopped being answered.

When they are all done:

```
python3 scripts/chat_tool.py digest WORK     # -> WORK/digest.md
```

If a reader failed, re-run just that one.

### 3. Planner (do this yourself)

Read `digest.md`. Settle the display names and genders, and write one sharp sentence on what this relationship or group is really about.

Then write the questions: the three core questions for the lens (in `references/prompts.md`), plus about 5 that could only be asked about *these* people.

- Name them, and the events and patterns the readers found.
- Press on what is uncomfortable to look at. Good: "Why did every plan Shira proposed get a 'yalla', and every plan Noam proposed get silence?" Bad: "How is the group's communication?"
- Give each question 3–6 search terms that actually appear in the messages.

Add any question the person asked for.

### 4. Investigators: one sub-agent per question

Spawn them **in the same turn**, each with the investigator brief. They read `digest.md`, use `chat_tool.py search` and `range` against the full chat to test their hypothesis and pull exact quotes, and write `WORK/answers/qNN.md`. Each answer ends with one hard question back to the person. One agent per question, with search, produces specific dated evidence, and can find that the question's premise is wrong.

### 5. Synthesis (do this yourself)

Read all the answers and the digest, and write the analysis using the synthesis structure for the lens. This is the deliverable, so it has to stand on its own. Don't walk through the questions one by one. Connect the findings, name the central pattern, and say plainly what the person's own part was.

### 6. Deliver

- Put the analysis in the reply, in the person's language.
- After it, list the questions the investigators sent back to them, numbered.
- Say that if they answer, you'll check their account against the chat and rewrite the analysis. When they do, follow "Follow-up rewrite" in `references/prompts.md`.

The analysis is personal, and in a group it is about people who never agreed to be analysed. Keep it in the reply unless the person asks for a document. Don't publish it as an artifact on your own initiative, and don't file details from the chat into memory.

## Ground rules for every agent

They are in the shared rules block in `references/prompts.md`. Pass them to every sub-agent, since each one starts cold. The reasons:

- **Every claim cites a date and a short exact quote.** The person will check every sentence against their memory. One invented quote discredits the rest.
- **Pointed, not cruel; no flattery.** They came for honesty. Softening wastes their time, and cruelty makes them stop listening.
- **Behaviour, not diagnosis.** Labels like "narcissist", "toxic" or "anxious attachment" can't be supported from text and they end the conversation. Describe what people did and said.
- **Fair to people who aren't in the room.** This matters especially in groups. Describe each member by what the chat shows, give them the benefit of context you don't have, and don't rank people as better or worse friends.
- **Text only.** Calls, meet-ups, private chats on the side and real-life context are missing. In a group, people often talk in private messages too, so silence in the group isn't proof of anything. Say so once where it matters.

## Smaller requests

If they ask one focused question ("who chased whom?", "does Omer always shut Noam down?"), skip the readers. Parse the chat, then answer it directly with `search` and `range`, or with one investigator for a long chat. Use the same evidence standard. Offer the full investigation afterwards in one line.

Without a sub-agent tool, run the same stages yourself in sequence. For readers, use `--budget 60000` to get fewer, larger periods.

## The page

`assets/blackbox.html` ("הקופסה השחורה") is the pair pipeline as a Hebrew, self-contained page. The person uploads a chat in their browser, and the page runs the readers, planner, investigators and synthesis through Claude on their own account, so nothing is stored. It analyses two-person chats; for a group chat it uses the two main writers, so run group investigations here instead.

To give it to them, publish the file with the Artifact tool:

- On the first publish, pass `capabilities: {"sample": {}}` and `icon: "chart"`.
- If an earlier conversation already published it, update that artifact rather than making a second copy.

Don't rebuild it from scratch. For changes, copy it to a scratch path, edit, and publish. Its prompts mirror the pair briefs in `references/prompts.md`, so change both together.
