# Easy Is Taken: deck content

_The words behind the deck, 2026-11-07. `npm run frames` builds `slides.md` from this file, `slides.src.md` and `deck/maps/`._

**How to read this file.** Section 1 holds the six take-home lines, each with what its scenario says is left. Section 2 is the mapping primer. Section 3 is the climate worked example. Section 4 is the run of show, with what goes on screen, cue-level speaker notes and a time per slide. Section 5 traces every quote on a slide to its source. IDs like F16 refer to my source ledger, which isn't published.

Two rules apply everywhere:

- "Writing software is a utility" is my reading of Fenton, offered as a supposition. No ledger row has Wardley or Fenton saying it (ledger, no-support 1 and 2).
- Every map position is judgment. No source places any platform component on the evolution axis (ledger, no-support 17).

---

## 1. One line per scenario

The close (slides 10 and 11). Each scenario gets its own answer to the title, a one- or two-sentence setup in "suppose" terms, and a question to take home. Six answers that don't agree, so the close picks no winner. The same lines appear as "In the talk" on each gallery page, so a photo of a slide can be found in the repo.

| Scenario | What's left | Setup | Line |
|---|---|---|---|
| user-need | Answering for what runs. | Our maps draw one user, the developer. Suppose a prompt meets half of what they need. The other half belongs to someone we never drew. | If your platform vanished tomorrow and your teams kept shipping, who would complain first? |
| gameplay | Whatever your team still chooses to build. | Teams stayed on the platform partly because the way round cost more. Suppose a prompt makes it cheap. Now someone else is watching too. | Who learns first what your teams keep asking for: you, or whoever sells them the agent? |
| climate | The gap between fast tools and slow practice. | Cheap code loads everything that didn’t get cheaper. Practice takes years to catch up, and a platform may live in that gap, for a while. | If checking a change got as cheap as writing one, what would your platform still do? |
| captured-decisions | Deciding, and making decisions bind. | Much platform opinion may be generic enough that a model already knows it. What stays scarce is deciding, and agents already do some of it. | What did your agents decide last week that nobody in the company knows was decided? |
| dissent-faster-craft | The craft, done faster. | The tools moved a long way. The work moved a little. A carpenter with a nail gun is still a carpenter, and nobody has industrialized the craft. | What are you building on as if it were already a utility? |
| dissent-no-platform | The work between people. | Push the supposition all the way and the platform leaves the map for anything one team can do alone. What stays is the work between teams. | When the config is perfect and the outage happens anyway, whose name is on it? |

**An optional extra.** Several of the scenarios reach for Wardley's market test, "Do all my competitors use such a component?" (U02). In the book it places a component on the evolution axis; asking it of a platform's decisions is a reading. Say it at the close only if time allows, in the U02 wording.

**Other questions that could swap in:**

- climate: "Who in your organization inherits what the prompt leaves behind?".
- captured-decisions: "If the decisions are the value, who is your customer, and have they been told?".
- dissent-faster-craft: "What would you have to stop checking before you called it a utility?".
- gameplay: "If a vendor sold your gate tomorrow, what would your team do on Monday that the business would notice?".

---

## 2. Mapping primer, 30 seconds

**On screen:** the empty axes from the worked example, with one dot and one line. Plain labels:

- **Up the side:** how close a thing is to the user. The user and their need sit at the top. What they depend on sits below.
- **Across:** how evolved it is, in four stages.
  - **Genesis:** new and uncertain.
  - **Custom-built:** made for one place, by hand.
  - **Product:** bought, with rival versions competing.
  - **Commodity or utility:** standard and metered.
- **Lines:** "depends on".
- **One more thing:** things drift right over time as they get understood and competed over.

**What it does not claim.** Nothing about speed or dates. Nothing about where any platform component sits; every dot in the talk is judgment. The stage descriptions are the book's basics (genesis, U05; custom-built, U06), said in plain words and not quoted. The ledger has no row yet for the book's Product and Commodity definitions, so the last two captions are my shorthand, and the notes say so.

---

## 3. Climate worked example

**The supposition, in one sentence:** if we generate far more code, the extra weight lands on the rest of the platform, which adjusts or falls apart.

Reduced from `maps/candidates/climate/`. Four frames, seven components rising to eight, eight links rising to nine.

### Components

| Component | Position `[visibility, evolution]` | Why it's on the map | Evidence |
|---|---|---|---|
| Team shipping a service | anchor `[0.96, 0.55]` | The user and need, folded into one anchor | Q01 for the anchor method. The fold is the review's call |
| Code and config | `[0.80, 0.45]` | The stock: what gets generated and then has to be run and changed | Judgment. C13 for the cost of keeping it |
| Writing software | `[0.56, 0.33]`, supposed move to 0.85 | The title's subject | Today: craft (C01 to C04). The move: my supposition, no source |
| Human gates | `[0.66, 0.64]`, inertia from frame 3 | Review, approval, release trains: where the weight lands | G06 for inertia over review; F14 for where Fenton puts the constraint |
| Policy checks | `[0.44, 0.60]` | Where opinion binds a change | Judgment |
| Golden paths | `[0.32, 0.42]` | A bundle of saved effort and someone's decisions | Judgment. The review notes 0.44 is an average of a bundle (U04); 0.42 is a layout shift |
| LLM | `[0.22, 0.66]` | The sourced move, in speech only | P01 to P05 for the direction. No arrow on screen, see below |
| Runtime | `[0.12, 0.84]` | A sourced utility beside the supposed one | P20, P21 |
| Verification beyond reading | `[0.70, 0.18]`, frame 4 only | A new practice opposite the gate | C07: the practices have "not yet emerged". Position is judgment |

**Choices made for the deck:**

- **The move keeps its links on the old dot.** Frames 2 to 4 use `evolve Writing software->Supposed utility 0.85`. cli-owm then draws the new dot with no links, and every line stays on the original. Tested in cli-owm. `deck/build/render-map.mjs` draws it that way: A stays solid with its links, and B is the dashed, accented "supposed" dot.
- **LLM has no arrow.** A plain `evolve LLM` moves its links with it, which would break the rule above. A renamed target adds a label. Its move is spoken instead. For an arrow, `evolve LLM->Heading to utility 0.82` keeps the rule at the cost of one more label.
- **Golden paths in place of Encoded opinion.** The room knows the word, and the frame 1 question needs the bundle. The split into opinion and output is the captured-decisions story, and it stays in the repo.
- **Verification has no arrow.** Its arrival carries "adjusts". One fewer mark.
- **Cut from the review's eight:** `Encoded opinion` (see above). Everything else the review cut stays cut.
- **Label offsets** were checked by eye on raw cli-owm renders at 680x280. They will need another pass once the builder restyles them.

### Frames

| # | File | Headline | Question bar | Highlight | Change from the frame before |
|---|---|---|---|---|---|
| 1 | `deck/maps/01-before.owm` | A platform, before the supposition | A golden path is two things in one box: effort someone saved you, and decisions someone made for you. When a team picks yours, which one are they paying for? | Golden paths | n/a |
| 2 | `deck/maps/02-suppose-writing-moves.owm` | Suppose writing software moves | If writing code gets cheap, so does anything priced on the effort to write it, like templates and modules. How much of your platform was priced that way? | Writing software | Dashed arrow from `Writing software` to `Supposed utility`. Links stay put |
| 3 | `deck/maps/03-where-weight-lands.owm` | Where the extra weight lands | More code arrives at the same gates, and the gates hold still. What in your organization didn’t speed up, and what’s queuing in front of it now? | Human gates | Inertia bar on `Human gates`. Fenton's F16 line on the slide |
| 4 | `deck/maps/04-adjust-or-fall-apart.owm` | Adjust, or fall apart? | Checking a change without anyone reading every line is a practice we’re still inventing. Is your platform where it gets worked out, or what teams route around? | Verification beyond reading | `Verification beyond reading` appears, linked from `Code and config` |

Frame questions 1 to 4 are the climate README's questions for frames 00, 01, 03 and 05, lightly trimmed. Frame 1's adds the two options so it reads without the speaker. Frame 4's is adapted from frame 05's "these practices" to "this practice", because the deck frame shows one practice where frame 05 shows four. Frame 3's headline is a neutral label so the slide carries one question, in the bar.

**Fenton's F16 line goes on frame 3**, under the headline and above the map, as a quote card:

> "If you up the rate and size of changes passing through the review stage, pressure is simply transferred to the real bottleneck."
> Steve Fenton, The New Stack, 2026-07-16

It fits frame 3 because the frame shows the same shape: more change arrives, and the gate it reaches doesn't get cheaper. Fenton writes about software delivery in general. He doesn't mention platforms, utility or Wardley in that piece (ledger, F12 row), so the slide shows his line beside the map and doesn't claim he drew it.

---

## 4. Run of show

**Total: 7:55 planned, inside the 9:00 ceiling.** Slide 8 of the first draft (the `.owm` code reveal) was cut on 2026-11-07, and the closing lines became two slides with a setup per scenario, which adds 0:30. The success review estimated the first draft's notes at 8:20 to 8:40 when spoken slowly with no mic. The tangents on slides 7 and 9 are now bracketed or cut, which brings the estimate to about 7:50. The spare time is for the booth: a late start, a changeover, or a question mid-talk. Steps 3 to 5 of the agreed flow (slides 4 to 9) take 3:55.

| # | Slide | Time | Running |
|---|---|---|---|
| 1 | Title | 0:20 | 0:20 |
| 2 | Easy is taken | 0:40 | 1:00 |
| 3 | My reading | 0:30 | 1:30 |
| 4 | Mapping primer | 0:30 | 2:00 |
| 5 | Six landscapes | 0:55 | 2:55 |
| 6 | Climate frame 1 | 0:30 | 3:25 |
| 7 | Climate frame 2 | 0:35 | 4:00 |
| 8 | Climate frame 3, with F16 | 0:50 | 4:50 |
| 9 | Climate frame 4 | 0:35 | 5:25 |
| 10 | What's left, 1 of 2 | 1:00 | 6:25 |
| 11 | What's left, 2 of 2 | 1:00 | 7:25 |
| 12 | The repo, and connect with me | 0:30 | 7:55 |

Notes are cues to speak from. Bracketed lines are optional, or to say only if asked. Slides 5 to 11 carry the supposition and the repo URL in a strapline at the top. Fenton is credited once, on slide 2, plus the citation under his F16 line on slide 8.

### 1. Title (0:20)

**On screen:** Easy Is Taken. What's left for platforms when software is a utility? Luke Philips. The CNPE community logo.

- Name, one breath. No mic, so ask the back row to wave if they lose me.
- Read the title once. Don't explain it yet.

### 2. Easy is taken (0:40)

**On screen:** "Easy is taken". Steve Fenton, 2026-10-19. Under it, F03: "a plentiful thing ain’t worth so much."

- Credit first: the phrase and the idea are Steve's, from a blog post three weeks ago.
- His point, in my words: if anyone can get the easy thing for the price of some tokens, the easy thing stops being worth much.
- Read the quote. Let it sit for a beat.
- Stop there. Steve never explains the title, so I won't explain it for him.

### 3. My reading (0:30)

**On screen:** I read that as software becoming a utility. Small line: A supposition for the next ten minutes.

- This is my reading. Steve didn't say "utility". Simon Wardley hasn't said it either, as far as I can find.
- Ask the room to hold it the way you'd hold a "what if" in a design review. Take it as given and see what moves. If it doesn't hold, throw it out after.
- "Competing with a prompt" is my phrase for it, if it comes up.
- [If someone mentions the New Stack piece: he wrote the next day that everything you touch with AI "becomes a commodity". That's about AI output, and not in Wardley's sense (P25).]

### 4. Mapping primer (0:30)

**On screen:** see section 2. One click adds the drift right.

- One sweep up the side: user at the top, what they depend on underneath.
- One sweep across: genesis, custom-built, product, commodity. Things drift right as they get understood and competed over.
- The last two captions are my shorthand for the book's definitions.
- Lines mean "depends on".
- Every dot today is my judgment, or an agent's I checked. Nobody has measured where these sit. Argue with them.

### 5. Six landscapes (0:55)

**On screen:** headline "Six landscapes, two of them dissents". A grid of six tiles. Each has the scenario name, a short definition of the lens in plain words, and one neutral question:

| Tile | Definition | Label |
|---|---|---|
| user-need | Start from who the platform serves. Wardley calls the user need “the anchor for the entire map”. | Who is the user once a prompt meets the first need? |
| gameplay | The moves players choose against each other, such as a platform and its vendors. | What can a platform hold, and against whom? |
| climate | What changes the map whatever anyone does. | What does the weather do to a platform? |
| captured-decisions | Tests one idea: a platform is worth the decisions it holds. | Is captured opinion the value? |
| dissent: faster craft | Disagrees with the supposition, in Simon Wardley’s phrase. | What if writing has only become “a faster craft”? |
| dissent: no platform | Pushes the supposition to its end. | Does the platform leave the map? |

Sources: the user-need quote is M02 and the climate line paraphrases M01 ("Climatic patterns are those things which change the map regardless of your actions"). Gameplay is the scenario's own framing; Wardley calls gameplay "context specific" (M03). "A faster craft" is C04 (2026-10-20); his name is on the tile, the date is in section 5.

- Same supposition, six lenses. Point at the two dissents. One borrows Wardley's phrase "a faster craft" and argues the move hasn't happened. That argument is the scenario's, not his. The other follows vibe-coded infra to the end and asks if the platform is still on the map.
- [Optional: say how these were made. AI agents drafted them from a checked quote ledger and critiqued each one, and I chose what went in the talk.]
- All six are in the repo, with every map and every review. The address is at the top of the screen from here on. Today we walk one.

### 6. Climate frame 1 (0:30)

**On screen:** `deck/maps/01-before.owm`. Headline, question bar, Golden paths highlighted.

- Climate is the weather: it happens whether you plan for it or not. That's why this is the one to walk.
- Top to bottom in one pass: a team shipping a service, the code and config, how it gets written, the gates and policy it passes, the runtime underneath.
- Golden paths: two things in one box. Effort somebody saved you, and decisions somebody made for you.
- Read the question. Don't wait for answers.

### 7. Climate frame 2 (0:35)

**On screen:** `deck/maps/02-suppose-writing-moves.owm`. Writing software highlighted, dashed arrow to "Supposed utility".

- Here's the supposition: writing software slides right.
- The lines stay on the old dot on purpose. Nothing on this map has actually moved yet, and I want it to look that way.
- LLMs are a different case: Wardley says they're heading toward utility (P01 to P05). Writing software he calls a craft, "a faster craft" now (C04). I haven't found him calling it a utility. That's the dissent you saw a minute ago.
- [If someone raises his forecast table: it's a forecast, and reading "industrialisation" as "utility" is my inference (P09).]
- Read the question.

### 8. Climate frame 3 (0:50)

**On screen:** `deck/maps/03-where-weight-lands.owm`. Human gates highlighted with an inertia bar labeled "holds still". Fenton's F16 quote card above the map.

- If writing gets cheap, we write a lot more. All that extra code and config still flows down these lines. The gates didn't get cheaper. The bar means they hold still.
- Read Steve's line. That's Steve again, from July, about software delivery in general. Steve works at Octopus Deploy, which sells deployment software.
- Read the question. This is the one I'd most like people to try on Monday.
- [If asked why more code: Wardley lists Jevons paradox among the patterns he expects with LLMs (G01, 2026-03-29).]
- [If asked what "Human gates" covers: Steve puts the real bottleneck after review: manual verification, change approval, release trains, hard deploys (F14).]

### 9. Climate frame 4 (0:35)

**On screen:** `deck/maps/04-adjust-or-fall-apart.owm`. Verification beyond reading highlighted, far left.

- Something new shows up opposite the gate: checking a change without a person reading every line.
- Way out on the left, because it barely exists. Wardley says the practices for safe vibe coding haven't emerged yet (C07).
- Two endings on one map. The gate holds and the queue grows. Or a practice grows up beside it and the platform shifts around it. I'm not picking one.
- Read the question.

### 10. What's left, 1 of 2 (1:00)

**On screen:** headline "What’s left? Six answers that don’t agree (1 of 2)". Three rows: user-need, gameplay, captured-decisions. Each row has the scenario name, what that scenario says is left (in the accent color), a one- or two-sentence setup and its question. The first row is up when the slide arrives; each click adds the next and dims the ones before. A last click brings all three back to full strength.

Suggested order: user-need, gameplay, captured-decisions, dissent: faster craft, climate, dissent: no platform. Rows 1 to 3 are on slide 10 and 4 to 6 on slide 11.

- About 20 seconds a row. Name the scenario, say what's left, give the setup in your own words, read the question. No commentary.
- Six answers to the title, and they don't agree. Pick the one that worries you.
- [Optional, cut it if time is short: most of the reviews reached for a question from Wardley's book for placing a component: "Do all my competitors use such a component?" Try it on your platform's decisions.]

### 11. What's left, 2 of 2 (1:00)

**On screen:** the same layout for dissent: faster craft, climate and dissent: no platform.

- Same rhythm, about 20 seconds a row.
- Climate's row lands second, as the callback to the frames we just walked.
- Pause on the full slide. Let people photograph it. Each row is on its scenario's page in the repo.

### 12. The repo, and connect with me (0:30)

**On screen:** two QR codes. One to `github.com/lukepatrick/easy-is-taken` with "Every scenario, map, review and source". One to `linktr.ee/lukephilips`, with my name. The CNPE community logo.

- Everything you saw, and the five scenarios we didn't walk, is in there. Every map is a text file: fork one and put the dot where you think it belongs.
- The other code is me, if you want to argue about where a dot sits.
- Close on the room: what you do with these questions is yours. Find me by the booth after.
- Leave this slide up through the changeover.

---

## 5. Quotes on screen, traced

Every quote that appears on a slide, with its ledger row. Wording matches the ledger exactly, including the curly apostrophe in F03.

| Slide | Quote | Ledger | Speaker, date |
|---|---|---|---|
| 1, 2 | "Easy is taken" (title phrase; credited once, on slide 2) | P28 source row and no-support 6 | Fenton, 2026-10-19 |
| 2 | "a plentiful thing ain’t worth so much." | F03 | Fenton, 2026-10-19 |
| 5 | "the anchor for the entire map" | M02 | Wardley, *Wardley Maps* ch. 4, 2016-08-16 |
| 5 | "a faster craft" (fragment of "The current use of AI gives us a faster craft.") | C04 | Wardley, 2026-10-20 |
| 8 | "If you up the rate and size of changes passing through the review stage, pressure is simply transferred to the real bottleneck." | F16 | Fenton, 2026-07-16 |
| 10 notes, optional | "Do all my competitors use such a component?" | U02 | Wardley, *Wardley Maps* ch. 2 |

**Referenced in notes, not quoted on screen:** F12, F14 (Fenton on where the bottleneck sits), P01 to P05 (LLMs toward utility), P09 (forecast table, if asked), P25 (Fenton's "commodity", if asked), G01 (Jevons paradox named, if asked; replaces P03, which comes from an unchecked podcast transcript), C04 ("a faster craft"), C07 (practices not yet emerged), G06 (inertia over review), P20 and P21 (runtime as utility), Q01 (anchor), U04 to U06 (bundles and stage definitions). The six scenario lines are questions from the candidate files and quote nobody.

**Checked by a person:** F12, F13, F14, F16, F17 and F18 were confirmed word for word on 2026-11-07 against a clipped copy of the New Stack article, which also gives Fenton as author and 2026-07-16 as the date. The article sets F16 as a pull quote. **Not checked:** U01 to U10 have had no independent fact check (ledger, second pass).
