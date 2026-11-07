# Scenarios

Six ways the platform-engineering landscape might move, each drawn as one Wardley map changing frame by frame. The talk tours them briefly; this folder holds the full set.

> **Starting point:** Steve Fenton's post ["Easy is taken"](https://stevefenton.co.uk/blog/2026/10/easy-is-taken/) gave this talk its phrase and idea. I read it as writing software becoming a utility. That's my supposition; neither Fenton nor Wardley says it. Four scenarios run with it and two push back, and nothing measures how far writing software has really moved.

## Reading a map

The user sits at the top, with what they depend on below; higher means more visible to the user. Left to right is evolution: genesis, custom built, product, then commodity and utility. A dashed red arrow is a supposed move, and a bar marks inertia. Every position is the mapper's judgment, since no source places any platform component on the axis. Follow the red highlight first.

The images are rough previews made by [`tools/render_owm.py`](../tools/render_owm.py); tap one to open it full size. The `.owm` text files beside them are the maps themselves, editable in [onlinewardleymaps.com](https://onlinewardleymaps.com) or the VS Code Wardley Maps extension.

## The six

### [User need](user-need.md)

**The lens:** start from who the platform serves. Wardley calls the user need "the anchor for the entire map".

Platform maps usually draw one user, the developer, who needs a change written and got through. Suppose a prompt meets the first half. The second half belongs to someone never drawn: whoever answers for what runs. Six frames.

**Punchline:** If your platform vanished tomorrow and your developers kept shipping, who would complain first?

**In the talk:** what’s left: *Answering for what runs.* Our maps draw one user, the developer. Suppose a prompt meets half of what they need. The other half belongs to someone we never drew. **If your platform vanished tomorrow and your teams kept shipping, who would complain first?**

[Scenario](user-need.md) · [Maps](../maps/candidates/user-need/)

### [Gameplay](gameplay.md)

**The lens:** gameplay is the moves players choose against each other, such as a platform and its vendors. Wardley calls gameplay "context specific".

A platform kept users partly because the way round it cost more than the way through. Suppose a prompt makes the way round cheap, and the platform is in a contest. Each frame is a turn for the platform, the vendors or the community. The platform is whatever set a team still chooses to build, and the last frame leaves it blank. Eight frames.

**Punchline:** Mark the blanks for your own organization: what would you call the set you'd still build?

**In the talk:** what’s left: *Whatever your team still chooses to build.* Teams stayed on the platform partly because the way round cost more. Suppose a prompt makes it cheap. Now someone else is watching too. **Who learns first what your teams keep asking for: you, or whoever sells them the agent?**

[Scenario](gameplay.md) · [Maps](../maps/candidates/gameplay/)

### [Climate](climate.md)

**The lens:** climate is what changes the map whatever anyone does. In Wardley's words, "Climatic patterns are those things which change the map regardless of your actions."

Cheap writing removes one reason for a platform and loads everything that did not get cheaper. Past success holds the team in place while practice takes years to catch up. A platform's value may sit in that gap, for now. This is the talk's worked example, and the [four frames shown in the talk](climate.md#in-the-talk) open its page. Eight frames.

**Punchline:** What is the one thing in your organization that did not speed up, and what is queuing in front of it now?

**In the talk:** what’s left: *The gap between fast tools and slow practice.* Cheap code loads everything that didn’t get cheaper. Practice takes years to catch up, and a platform may live in that gap, for a while. **If checking a change got as cheap as writing one, what would your platform still do?**

[Scenario](climate.md) · [Maps](../maps/candidates/climate/)

### [Captured decisions](captured-decisions.md)

**The lens:** tests one idea head on, that a platform is worth the decisions it holds.

The idea survives in a much smaller form. Much platform opinion may be generic, and a file can hold it. What stays hard is deciding, and making a decision bind on every change. The scenario ends on decisions agents took unnoticed, and on who else can read a business once it is written down for a machine. Eight frames.

**Punchline:** What did your agents decide last week that nobody in the company knows was decided?

**In the talk:** what’s left: *Deciding, and making decisions bind.* Much platform opinion may be generic enough that a model already knows it. What stays scarce is deciding, and agents already do some of it. **What did your agents decide last week that nobody in the company knows was decided?**

[Scenario](captured-decisions.md) · [Maps](../maps/candidates/captured-decisions/)

### [Dissent: faster craft](dissent-faster-craft.md)

**The lens:** disagrees with the supposition, using Simon Wardley's phrase "a faster craft".

Going from a need to software someone will trust in production is still craft, done faster. New work keeps appearing on the left of the map, and no stable layer has arrived to build on. Six frames.

**Punchline:** What would you have to stop checking before you'd call writing software a utility?

**In the talk:** what’s left: *The craft, done faster.* The tools moved a long way. The work moved a little. A carpenter with a nail gun is still a carpenter, and nobody has industrialized the craft. **What are you building on as if it were already a utility?**

[Scenario](dissent-faster-craft.md) · [Maps](../maps/candidates/dissent-faster-craft/)

### [Dissent: no platform](dissent-no-platform.md)

**The lens:** pushes the supposition to its end.

Pushed past the evidence on purpose, the supposition takes the platform off the map for anything one small team can do alone. What stays is work between people: agreements across services, checks the author can't edit, and a named owner when things fail. The last frame turns the same argument on that residue. Six frames.

**Punchline:** When the config is perfect and the outage happens anyway, whose name is on it?

**In the talk:** what’s left: *The work between people.* Push the supposition all the way and the platform leaves the map for anything one team can do alone. What stays is the work between teams. **When the config is perfect and the outage happens anyway, whose name is on it?**

[Scenario](dissent-no-platform.md) · [Maps](../maps/candidates/dissent-no-platform/)

## Sources

Bracketed IDs such as D34 refer to my source ledger, which holds each quote with its link and date. It isn't published; the quotes on these pages are word for word.
