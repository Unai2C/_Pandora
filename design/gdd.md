*Work in progress · grown from `gdd-template.md`*
*Doc: ▓▓▓▓▓▓▓▓░░ · Core design and progression are documented. Final public title, deployment details, delivery scope and next funding-round requirements remain open. Document-only session; no tests run.*

# Pandora

Owner-confirmed working title: Pandora. Final public title remains undecided.

| Proposal field | Current status |
|---|---|
| Public title / IP and content review | Pandora is a working title; final title and review are TBD. |
| Deployment target | Decentraland World or Genesis City location TBD. |
| Team / studio | TBD; not specified in the design. |
| Contact | TBD. |
| Document date | 2026-10-04 |
| Funding round | TBD; the next eligible call and its requirements must be confirmed. |

## 0. TL;DR

**Player promise:** Explore floating islands, gather resources, fight monsters and find treasure together to grow one shared village while developing a personal RPG hero.

**What makes it distinct:** Three always-open activities feed both personal progression and a visible, automatically evolving settlement. Players can join a nearby fight without a party; no quest acceptance, construction voting or resource allocation interrupts play.

**Launch design:** A shared village, three connected islands, three activity families, a 13-level repeating village cycle, a level-99 personal progression system, a mix-and-match skill board, robot-assisted abilities, runes, chests, a shop and inherited Alien Scrapyard UI geometry. Values remain provisional where identified as such.

**Delivery claim:** This document defines the intended game, not a verified release scope. Team capacity, deployment location, production schedule and the next funding call are still TBD; no Pandora playtest or performance test is claimed.

**Status:** Design in progress; existing mechanics are reused by design intent. Production and implementation status must be confirmed against the project before an application is submitted.

[Owner revision · 2026-10-04] Launch economy, currency, chest equipment and shop rules are defined in [economy-and-items.md](economy-and-items.md). Town coins are server-side story currency; physical crystals and one-use grimoires are expansion content. Initial coin payouts, milestones, shop prices/effects, rune bonuses and cycle rewards in [proposal-defaults.md](proposal-defaults.md) are approved initial balance values, not tested results.

The proposed initial balance and remaining high-level design questions are summarized in [proposal-defaults.md](proposal-defaults.md). Existing resource, village-cycle, combat and skill values in the linked design files are provisional unless marked owner-approved.

## 1. Player Promise

> [agent-decided · accepted] Explore floating islands, gather resources, fight monsters and find treasure together to grow a shared village while building your own RPG hero.

**Why this game:** [agent-decided · accepted] We want to build on what we learned in Alien Scrapyard and create a more collaborative Decentraland world. Each player's actions help a shared village grow while their own character develops.

The initial/intermediate/advanced content catalogue is in [world-phases.md](world-phases.md). [agent-decided · accepted] Include the Forest, Caves and Ruins in the initial launch; all are explorable from the start, with content and enemy difficulty staged by village phase. Physical crystals are reserved for an expansion; town coins are the server-side story currency.

## 2. First Minutes & How to Play

[agent-decided · accepted] Start at the village center with a nearby gatherable resource and delivery point visible. No mandatory tutorial or accepted quest. Keep this arrival opportunity available even in an advanced village. Times below are design targets, not measured results.

| Time | Player experience |
|---|---|
| **0–5 seconds after control** | You appear at the village center and see a nearby resource and the delivery point. |
| **5–10 seconds** | You can gather with one press or tap and see your carried resource count change. |
| **10–60 seconds** | You can deliver everything and see the matching common need update, or the shared stock increase if that need is already met. |
| **1–3 minutes** | From the center, a resource path, a monster and a treasure clue show three available choices. Choose any activity freely; the first automatic personal objective milestone advances toward coins, while the activity also contributes to character growth or village needs. |
| **3–10 minutes** | Use the first learned active skill in an encounter or continue gathering/exploring. XP and activity feedback advance personal growth; joining another player's fight needs no party or invitation. | Try another activity or help the shared village meet a different need. |
| **Natural stopping point** | Leave when ready: level, skills, coins, runes, counters and undelivered resources save automatically. Return with personal progress intact, then continue exploring or deliver what you carried. |

**How to play**

- Explore, gather resources, fight and open treasure.
- Deliver what you carry; grow the village together.
- Earn XP, learn skills and help nearby fighters.

## 3. Core Loop

The village progresses through 13 levels and then restarts in a loop. Per-level requirements and reset rules are in [village-cycle.md](village-cycle.md). Each cycle targets roughly two weeks for a community of about four regular contributors; this is a planning target, not a deadline or tested forecast. After level 13, the village returns to level 1, preserving personal progression, delivered surplus and cycle history. Each eligible contributor receives 100 town coins and a cycle-exclusive badge; a qualifying contribution is a resource/supply delivery or eligible combat help during that cycle. Everyone eligible receives the same reward, including offline players at next login. Players may join at any time. Badges are recognition only and remain in the player's private profile. Other players cannot inspect profiles; only level and health appear overhead during combat. Repeat the same requirements each cycle; quantities remain an untested balance baseline. Preserve Alien Scrapyard's existing UI dimensions and positions.

Islands connect through authored physical jump-and-glide routes; mandatory bridges are not required [agent-decided · accepted]. The direct route graph is Forest ↔ Caves ↔ Ruins, with no direct Forest–Ruins connection [agent-decided · accepted]. Make routes visually recognizable from the village and nearby islands; do not add interface markers [agent-decided · accepted]. All islands remain explorable from the beginning; the graph describes direct connections, not an access lock or guaranteed route, since the native Decentraland paraglider remains available. Exact geometry, glide distances and eligible travel-point placement remain level-design work. Explorer movement abilities are robot-assisted speed boost, aerial ascent and Phase Jump to already visited points; they complement rather than replace the paraglider.

The village is vegan. Food requirements use plant-based resources, initially wild fruit; meat is removed from the resource economy. Birds and deer remain peaceful ambient wildlife, not hunting targets or loot sources. Combat against hostile monsters is a separate activity; defeats give experience and village progress, not meat or gatherable resources.

Resource gathering uses one press or tap within 8 metres; holding is not required. Each active node yields five base units, before any yield bonuses. A successful gather adds actual units to carried inventory, lifetime counters and personal XP. Provisional per-island node counts and respawn intervals are listed in `world-phases.md`.

[agent-decided · accepted] Basic combat uses one press or tap per robot projectile, at 6 metres with a 1-second minimum interval and no automatic repetition or aura cost. Base damage is 10 plus Strength gained above its start value. Target assistance selects the hostile nearest screen centre; peaceful wildlife and players are invalid targets. Players move normally to avoid readable enemy telegraphs; no dedicated dodge control is added. Enemy patterns and stats are listed below and remain provisional balance values.

The three always-open activities are gathering resources, fighting hostile monsters and finding treasure. Track each resource type, eligible defeats and opened chests separately. Fixed personal objectives automatically count actions; no quest acceptance, mission selection or prerequisite is required. Personal milestone rewards are town coins: 10 coins at each 100 lifetime resource units, 10 eligible defeats and 5 opened chests. Counters never reset, and objective rewards do not add village credit a second time. Coins, drops and other economy rules follow [economy-and-items.md](economy-and-items.md). All activities support solo progress and optional cooperation. Enemy defeats grant fixed personal XP to qualifying contributors, plus the accepted collaboration bonus when at least two players qualify. On defeat, the player returns to the village and keeps earned XP and carried resources. An encounter continues while any participant remains fighting; it resets only when all participants have fallen or left. Closed mission sessions are not part of the launch design.

**Design pillars**

1. **One world, shared growth:** Individual actions visibly advance a settlement everyone uses.
2. **Choose your own contribution:** Gathering, combat and treasure stay available without quest gates.
3. **Build your own hero:** Permanent board choices and equipped runes support mixed RPG builds.

All players share one village and its development. [owner-approved direction] The central landmark is a large bioluminescent tree, with communal buildings arranged around it and growing during the 13-level cycle; its final name and logo remain open. The center is the arrival and resource-delivery point. From village level 1, players can access the shop and skill board there; later buildings activate preprogrammed services. The 13-level building sequence is defined in [village-cycle.md](village-cycle.md), with provisional resource requirements listed there. Food is plant-based and spent on village growth, with no continuous upkeep. [agent-decided · accepted] Services open by interacting with their physical building or station and use the inherited UI windows and positions; the interaction range is 8 metres, or 12 metres for the shop. The level-2 storehouse shows shared reserves and remaining needs read-only. From level 3, the communal shelter restores aura to maximum outside combat; from level 5, the infirmary restores health fully for free. At level 9, the observatory lists already visited Phase Jump destinations allowed by skill rank and identifies islands with active guardians or special treasures, without revealing exact resource or chest locations. Each character keeps individual RPG progression. [owner revision · accepted] A chest opens with one press or tap. Its finder alone receives discovery credit, carried Supplies and any personal rune; Supplies count toward village needs only after delivery. Other nearby players receive no chest credit. The chest disappears for everyone after its contents are resolved and respawns independently. Construction resources and activity requirements advance the village automatically; players do not choose buildings or construction projects.

Players deliver all carried expedition resources in one action to the shared village stockpile. Village development is automatic and follows the preprogrammed 13-level path in [village-cycle.md](village-cycle.md): predefined buildings and services appear at their assigned levels. Players do not select construction projects, set priorities or allocate resources. Player development choices belong in the personal skill board.

Players automatically progress fixed personal objectives through their actions. Village advancement combines separate activity and resource requirements; players see one common progress bar and the amount still needed in each required category, never a numerical village-point score. All required categories must be fulfilled; extra wood cannot replace missing fruit or monster defeats. The village then grows automatically with predefined buildings. When a level completes, all players see a brief announcement in the inherited feedback panel, then the new building or visual state appears immediately with a brief animation and no construction timer. This shared unlock grants no duplicate personal XP or coins. Preserve established HUD positions and dimensions.

[agent-decided · accepted] Compute the common village bar from equal-weight, capped category completion: each nonzero required category contributes the same share, capped at its current requirement, so the bar reaches full only when every requirement is complete. The per-level quantities are listed as provisional in `village-cycle.md`; personal lifetime counters stay separate from current village requirements.

[agent-decided · accepted] Collecting resources advances personal activity progression immediately and adds them to the carried inventory. Delivering all carried resources advances the matching village requirements. Credited creature defeats also advance personal and village counters when performed. Collection does not advance the village requirement a second time before delivery. The launch shop uses server-side town coins, not physical crystals. Shop products, prices and effects, plus personal milestone rewards, follow [economy-and-items.md](economy-and-items.md) and [proposal-defaults.md](proposal-defaults.md). The shop sells attribute-only runes, one health supply and one aura supply; it has no launch cosmetics. Physical crystals, item trading and grimoire use are expansion content. Use one press or tap from the inherited inventory/menu interface; add no HUD control. Delivered surplus automatically applies to later levels and carries across cycles.

Personal skill progression tracks performed activity independently of the carried resource balance. Gathering 340 wood counts as 340 gathered for personal development; delivering transfers all 340 to the village and preserves the activity history. Activity weights are used only for the shared village progress bar; players never see or spend village points. Personal crafting or tool upgrades paid with expedition resources are excluded from this design; resources support the common village cycle.

The character has an RPG skill board. [agent-decided] Use three mixable branches, with no permanent class selection: explorer, warrior and mage. Players may develop all three branches.

[agent-decided · accepted] Gathering resources, discovering treasure and participating in combat automatically grant personal experience. Experience advances character level; level-ups grant skill points. Personal milestones award coins separately from XP. Players gain XP through these activities even before reaching a milestone. Provisional XP amounts are detailed in Personal experience attribution below; combat eligibility follows the accepted damage/useful-healing contribution rule, with a 25% per-player collaboration bonus when at least two players qualify.

[agent-decided · accepted] Each character level-up grants exactly one common skill point. Each successive rank costs twice the previous rank: rank 1 costs 1 point, rank 2 costs 2 points, and rank 3 costs 4 points (owner decision). Costs are paid separately for each rank, so one fully upgraded skill costs 7 points. The 12-skill launch board therefore costs 84 points to complete. Personal levels and village levels are separate. Players may spend these points in explorer, warrior or mage branches, independently of which activity earned their progression. There are no separate branch currencies and no requirement to practise magic before learning the first magical ability. Activity counters record what each player does; they do not restrict skill-point allocation. The provisional XP curve and level-99 cap are specified in Personal experience progression below; there are no extra personal-level prerequisites for skills beyond available points and sequential ranks.

[agent-decided · accepted] New characters start with basic attack and gathering available, plus one initial skill point. Starting skill choices will be revised to match the new robot-assisted paths; Tracking is removed. The point is available before the first level-up; these first active-skill choices each cost one point. [agent-decided · accepted] Show a discreet available-point notice within the inherited UI layout. Do not automatically open the skill board or require spending the point before exploring; the player opens it and spends the point when ready. The initial point is for choosing a first active skill; later level-ups also award one point and skill ranks cost 1, 2 and 4 points.

Owner revision: skills have separate active and passive equipment slots. Both slot sets expand through progression, up to five active and five passive slots per character. Passives must be equipped in passive slots to apply; learning a passive alone does not make it active. The earlier fixed two-active-slot limit and unlimited automatic passives are superseded. [agent-decided · accepted] Slot capacity represents robot capacity and progresses separately from attributes; Intelligence does not grant or gate active or passive slots. [agent-decided · accepted] Provisional automatic slot schedule by personal level: level 1 gives 1 active and 1 passive; level 5 gives 2 each; level 10 gives 3 each; level 20 gives 4 each; level 30 gives 5 each. Unlocks cost no skill points and persist across village cycles; notify the player briefly through the inherited feedback panel when a new pair of slots unlocks, without automatically opening the board. A newly unlocked slot starts empty; players equip a learned skill manually, without spending points on the slot or auto-equipping. [agent-decided · accepted] Keep all five active and passive slot positions fixed in the skill UI; slots not yet unlocked appear dimmed, preserving layout as capacity grows. Active and passive skills can be swapped at any time, including during combat. Each ability retains its cooldown while unequipped. Swapping passives never refills health or aura. Preserve the inherited Alien Scrapyard inventory/skill-board layout and control positions; its expanded capacity will be fitted during implementation without moving established panels. [agent-decided · accepted] Player level progress, health and aura share the existing lower HUD panel. On the 1920×1080 reference canvas it stays at bottom 18/left 460, size 1000×58 on desktop, and bottom 14/left 304, size 1312×78 on compact mobile. Reorganize contents inside it only. Health and aura appear as labeled/icon bars without numeric values; when aura is insufficient, the existing feedback shows the missing amount. When player health drops below 25%, the health bar briefly flashes to flag critical health. No new HUD region or control is added; exact styling remains for implementation.

Character attributes are Strength, Resilience and Intelligence (owner decision). [agent-decided · accepted] Strength increases physical damage, including physical robot shots. [agent-decided · accepted] Provisional basic physical attack damage = 10 + Strength gained above its starting value. Impact Pulse applies its rank multiplier to this result, without adding Strength a second time. Starting Strength is 1. Enemy physical/magic resistances are listed in the enemy table. Resilience increases maximum health and reduces incoming damage. [agent-decided · accepted] Provisional starting health is 100. Each point of Resilience gained above the initial value adds 5 maximum health: maximum health = 100 + 5 × Resilience gained. [agent-decided · accepted] Provisional Resilience damage reduction = Resilience gained / (100 + Resilience gained). This gives about 9% at 10, 23% at 30 and 33% at 50 gained Resilience, and can never reach immunity. Apply this reduction before the equipped Warrior passive, which reduces the remaining damage. Starting Resilience is 1. Intelligence increases magical and healing ability potency and maximum aura. Movement effects have their own upgrades on the skill board. [agent-decided · accepted] Active movement skills, including aerial propulsion, flight and teleportation, consume aura; a larger aura pool supports their use. This does not add aura costs to native Decentraland movement or its always-available paraglider. Owner revision: attributes grow automatically according to progression through the skill board, not through manually allocated attribute points. Explorer grants +2 Strength, +2 Resilience and +2 Intelligence. Warrior emphasizes Strength and Mage emphasizes Intelligence. Learning a skill automatically grants the attribute increment associated with that skill type (owner decision). [agent-decided · accepted] Mage skills grant +1 Strength, +2 Resilience and +3 Intelligence. Explorer skills grant +2 to all three attributes. [agent-decided · accepted] Every Warrior skill rank grants +3 Strength, +2 Resilience and +1 Intelligence. Award on learning, not merely equipping or switching slots. [agent-decided · accepted] Every newly learned rank, including ranks 2 and 3, grants the same branch attribute increment again. Award once per learned rank, not per skill point spent or on equipment changes. Thus the rising costs 1/2/4 do not multiply the attribute award. Starting Strength, Resilience and Intelligence are each 1. Remaining derived-stat formulas stay open. Attributes are distinct from class paths, skill ranks, equipped slots and current aura.

[agent-decided · accepted] Health recovery: once the character is outside combat under the accepted 8-second combat-state rule, health regenerates at 2% of maximum health per second. Taking damage or re-entering combat stops this recovery. The unlocked infirmary restores full health immediately and free of charge. Health supplies remain useful because they may be used during combat. Defeat returns the player to the village at full health while preserving progression, carried resources and items.

[agent-decided · accepted] The companion robot executes the basic attack as a physical projectile. One press or tap fires once at a hostile target within 6 metres, with a minimum 1-second interval between shots, no automatic repetition and no aura cost. Damage uses the accepted formula 10 + Strength gained above the starting value. Light targeting assistance selects the hostile enemy nearest the centre of the screen within range. Peaceful fauna and players are never valid targets. Precision Shot remains distinct through its 12/15/18-metre range and rank damage multipliers.

[agent-decided · accepted] The first Explorer active skill is a temporary speed boost executed by the companion robot. It consumes aura and has a cooldown. Flight and teleportation are later skills, with exact unlock conditions undecided. [agent-decided · accepted] Provisional Boost ranks 1/2/3: +20% speed for 4 seconds, +30% for 5 seconds, +40% for 6 seconds. Every rank costs 15 aura and has a 15-second cooldown. Values are rank totals, not cumulative bonuses. [agent-decided · accepted] Explorer movement-speed effects stack additively: equipped speed passive percentage + active Boost percentage. Example at rank 3: +15% passive +40% Boost = +55% total while Boost is active. This affects the game ability modifiers only and does not alter native paraglider rules. Native paraglider access is unchanged.

[agent-decided · accepted] Impact Pulse is the first Warrior active skill: the companion robot emits a short forward burst that damages nearby hostile monsters. It deals physical damage improved by Strength. [agent-decided · accepted] Provisional ranks 1/2/3 deal 150%/200%/250% of basic-attack damage per enemy in the frontal area, at 3 metres range. All ranks cost 20 aura and have an 8-second cooldown. Only the frontal area's exact width and angle remain to be set in implementation/design. It does not target peaceful wildlife or allies.

[agent-decided · accepted] Healing Pulse is the first Mage active skill. The robot emits a wave healing its user and nearby allies. Provisional rank 1/2/3 base healing restores 15%/22%/30% of each recipient's maximum health. All ranks have a 4-metre radius, cost 25 aura and use a 12-second cooldown. Intelligence multiplies base healing by 1 + 0.03 × gained Intelligence [agent-decided · accepted]. Rank percentages replace one another.

[agent-decided · accepted] Arcane Bolt (Descarga arcana) is the second Mage active skill. The floating robot launches a magic projectile at one hostile monster. Rank 1 deals 30 base magic damage to its target. Rank 2 deals 45 to its target and 20 to other hostile monsters within 2 metres of impact. Rank 3 deals 60 to its target and 35 to other hostile monsters within 3 metres. Multiply both direct and area damage by the accepted Intelligence effectiveness multiplier. Every rank has 15-metre range, costs 25 aura and has an 8-second cooldown. Rank values replace one another; they are not cumulative. Peaceful wildlife and allies cannot be targeted.

[agent-decided · accepted] Link Field (Campo de enlace) is the third Mage active skill. For a limited duration, the floating robot projects an aura around its user. The user and nearby players deal more physical and magic damage while they remain inside the field, without requiring a formal party. Provisional ranks 1/2/3 grant +10%/+15%/+20% damage in a 4/5/6-metre radius for 5/6/7 seconds. Every rank costs 30 aura and has a 20-second cooldown. When fields overlap, each affected player receives only the strongest bonus; bonuses do not stack. Intelligence does not increase this percentage. Rank values replace one another; they are not cumulative.

Owner revision: Explorer skills focus on movement (speed, aerial ascent and teleportation); Mage skills cover offensive magic, healing and ally support; Warrior skills cover damage, defence and ranged attacks. Resource/treasure detection is removed. A small floating robot accompanies the character and visually executes abilities, including ranged shots instead of bow gestures. The launch roster and three mixable skill branches are summarized in [class-paths-proposal.md](class-paths-proposal.md); detailed effects and balance values are specified in this GDD. No separate class specialization/mastery ladder exists at launch.

Retain the established control and progression framework while revising the roster: basic attack, growing active/passive slot sets, cooldowns and effects from equipped passives. Owner revision: active skills consume a shared personal aura bar. This supersedes the previous no-resource/no-mana rule. [agent-decided · accepted] Aura regenerates automatically, slowly during combat and faster outside combat. Basic attacks consume no aura. [agent-decided · accepted] Combat state controls aura regeneration only, not skill swapping. Enter or refresh combat state when attacking, receiving damage or healing someone in combat; leave after 8 seconds without those actions (provisional duration). The aura bar indicates slow versus fast recovery. [agent-decided · accepted] Provisional base aura capacity is 100, with base regeneration of 2 aura per second in combat and 5 per second outside combat. [agent-decided · accepted] Each point of Intelligence gained adds 2 maximum aura: maximum aura = 100 + 2 × Intelligence gained above the starting value. Starting Intelligence is 1; initial maximum aura stays 100. Intelligence alone does not increase regeneration. [agent-decided · accepted] Provisional magic and healing effectiveness multiplier = 1 + 0.03 × Intelligence gained above the starting value. Apply this linear multiplier once to the base effect; each gained Intelligence point adds 3%, not 3% compounded. This does not change cooldowns, ranges or aura regeneration. The equipped Mage passive increases regeneration by its accepted rank percentage. All launch active skill costs are specified in their sections below. [agent-decided · accepted] If current aura is below an active skill cost, the skill does not activate, spends no aura and does not start its cooldown. Briefly flash the skill control and aura bar, showing the missing aura amount. Do not interrupt movement or basic attacks. Each skill has sequential paid ranks costing 1/2/4; personal development is independent of village level, with no separate specialization/mastery ladder.

[agent-decided · accepted] Initial passive skills for the revised board: Explorer increases movement speed; Warrior reduces incoming damage; Mage increases aura regeneration. Each must occupy a passive slot to apply and has the established three paid ranks (1/2/4 points), with branch attribute gains awarded once when each rank is learned. [agent-decided · accepted] Provisional rank 1/2/3 effects: Explorer movement speed +5%/+10%/+15%; Warrior incoming-damage reduction 5%/10%/15%; Mage aura regeneration +10%/+20%/+30%. Each rank replaces the previous effect; do not add the three rank percentages together. Same-type bonuses add; defensive effects use the sequential mitigation order defined in this GDD. This replaces the earlier initial passives of gathering yield, maximum health and healing effectiveness.

[agent-decided · accepted] General character level, activity counters, common skill points, learned abilities, carried expedition resources and shared village stock are separate records with the rules defined in this document. Numerical values explicitly marked provisional remain balance baselines for future adjustment. Village progress is computed from its category requirements and displayed without numerical village points.

[agent-decided · accepted] Participation rule: dealing damage to the enemy or restoring health to a participant counts as combat help. On defeat, each qualifying contributor gains personal combat-objective progress, while the village records one shared enemy defeat. Credit is not determined by the final blow. Exact eligibility is defined in the combat participation section; loot remains tied to treasure chests.

The automatic 13-level village sequence, starting actions, skill-point rules and town-coin milestones are defined below. Remaining work includes tuning provisional village requirements, completing physical island layouts and spawn-point placement, and preparing a production schedule. Do not treat pending balance or implementation details as tested claims.


[agent-decided · accepted] The owner confirmed the complete Explore → Act → Deliver → Develop loop below. Initial-session details, timing and numerical balance remain open.

| # | Step (verb) | What the player does (Player input → what they see or hear → what changes) | Why do it again? |
|---|---|---|---|
| 1 | Explore | Move and glide through physically connected islands → see shared resources, monsters and chests → choose where to act. | Look for a needed resource, an encounter or a discovery. |
| 2 | Act | Gather with one tap, attack with one tap per strike, use a learned skill, or open a chest → receive visible action feedback → activity counters advance; gathered resources and chest Supply Bundles enter carried inventory; supplies credit the village on delivery, while qualifying gear goes to the finder. | Advance an always-active objective or help another player. |
| 3 | Deliver | Return to the village center and deliver all gathered resources in one interaction → remaining category needs update → shared stock and the common progress bar advance, with surplus retained. | Complete what the village still needs. |
| 4 | Develop | Personal milestones award coins; level-ups grant skill points; spend points on chosen skills → improved abilities support later outings. When all shared requirements are met, the village grows automatically. | Pursue the next personal milestone or common village requirement. |

[agent-decided] First-session and repeat-loop timings above are design targets only; they have not been tested. Repeat play comes from the player's open choice among resource needs, enemy encounters, treasure discovery and cooperative help, alongside automatic shared-village growth and personal skill progression.
[agent-decided · accepted] Persistence: automatically save character level, XP, learned skills, coins, runes, inventory items, cumulative activity counters and gathered resources not yet delivered. Returning players spawn at the village. Re-entry does not automatically deliver carried resources. Reuse Alien Scrapyard's server-backed profile/storage architecture, adapting fields to this game. Save timing, active-effect duration across sessions and reconnection details remain to be designed.

## 4. Why Players Come Back

[agent-decided · accepted] Return motivation comes from two persistent tracks: contributing to the shared village's 13-level cycle and advancing the character's personal RPG progression. Future expansions are intended to add collectable/useful items and skills, extending these same tracks rather than replacing the core loop. Their release cadence and exact content remain TBD.

### 4.1 The next-day (D1) sentence

[HYPOTHESIS] (H1-02) A player who enjoyed the first session returns the next day to continue their personal character progress and help with the village's visible unmet needs; when they return, they can see what the community advanced while they were away. The village need and personal skill path persist without a push notification.

### 4.2 The progression chain

| Moment | What persists or has been built? | What becomes possible next? | How can another player tell? |
|---|---|---|---|
| **End of first session** | Character XP, activity counters, carried resources and shared village contributions persist. | Deliver carried resources; progress personal milestones; earn skill points and learn or equip abilities. | The common progress window shows outstanding needs and recent contributors; the player's cycle badges are visible only in their own profile. |
| **End of first week** | Personal levels, learned skills, inventory and village cycle progress continue. | [HYPOTHESIS] (H1-03) A new player who completes about three 20-minute sessions can reach personal level 5, unlock a second active and passive slot, and learn mixed-branch skills. | The village state and common progress are visible to everyone. A character's level and health indicators appear above them when combat begins; profiles, skills, equipment and other personal details cannot be inspected by other players. |
| **Week 3+ — what takes more than two weeks?** | The character's skill board, lifetime milestones, inventory and cycle badges persist; the village repeats its 13-level cycle. | Continue mixing and ranking skills, earn cycle participation badges, and pursue additional items and skills in future expansions. Expansion timing and contents are TBD. | The player's cycle badges are visible in their own profile; during combat, other players see only level and health indicators above the character. Shared village growth remains visible in the scene. |

First-week scene: [HYPOTHESIS] (H1-03) The player has reached level 5 after roughly three 20-minute sessions; village development continues through the shared cycle independently of that player's personal level.

[owner revision · accepted] Character profiles are private: players can inspect only their own profile. Other players cannot inspect another character's skills, equipment or counters. The earlier proposal to show cycle counts beside player names is superseded; cycle badges remain in the owner's private profile. During combat, show only the character's level and health indicators above their head; keep those indicators hidden outside combat.

Town coins are earned from lifetime activity milestones, chests, enemy defeats and selling eligible found items. Persistent counters prevent repeat claims for the same milestone. Physical crystals are reserved for a future expansion.

### 4.3 Two return hooks

| Selected hook | Exact trigger or timing | What the player anticipates | Reminder channel + no-reminder fallback |
|---|---|---|---|
| **1. Shared village cycle** | Each time the player returns, including the next day; the current level's required categories and remaining quantities persist until the community completes them. | Help meet the visible shared needs, see the village advance, and find newly available preprogrammed services. | No push notification. The player remembers their unfinished contribution; on return, the existing common-progress window shows current needs and recent contributors, while the scene shows any new village state. |
| **2. Personal RPG and collection growth** | Every play session; activity continues to build XP, skill points, activity milestones, coins and runes. Future expansions add more items and skills; their cadence is TBD. | Improve the character through the mixed skill board, obtain useful items, and have more long-term progression to pursue as the game expands. | No push notification required. The existing profile, skill board and inventory show personal progress when the player returns. |

## 5. Social by Design

[agent-decided · accepted] The common village retains progress made by other players while someone is offline. Returning players benefit from buildings and activities unlocked during their absence. Show a brief return notice with new construction and the remaining needs for the next village advance. This is progress caused by player contributions, not automatic idle resource generation.

Collaboration is a core design priority. Always-active individual objectives and character development contribute to one common village. The village manages construction automatically; players help it grow through their activities and deliveries. New village buildings and their activities are shared benefits.

| | |
|---|---|
| **The repeatable social loop** | [agent-decided · accepted] Player A fights an enemy; player B can join the fight directly, without forming a party. Defeating that enemy can advance both players' relevant individual objectives. Players complete individual objectives and deliver their expedition resources toward the same village progression. Collective progress unlocks predefined buildings and activities for everyone. [agent-decided] Show the current common objective and outstanding needs so players can see how their actions help, without accepting quests or managing construction. |
| **The disappearance test** | Without other players, direct assistance and the collaboration XP bonus disappear. Enemy health and damage do not scale with player count. Balance guardian/boss encounters for a typical group of up to four, with no hard join cap; solo completion remains a design baseline requiring future balance validation. |
| **From strangers to a group** | [agent-decided · accepted] Join an ongoing enemy fight directly, without invitations or party menus. |
| **Recognition & continuity** | [agent-decided · accepted] Show recent contributors by name in the existing common-progress window. This is brief recognition of help, not a competitive ranking; preserve the established UI dimensions and positions. |
| **Quiet hours & player counts** | [agent-decided · accepted] All fixed objectives are always active and support solo progress and optional cooperation. Direct combat assistance starts with two players; guardian/boss encounters are balanced for up to four typical contributors, without a hard join cap. Maximum world population remains a technical deployment decision. |
| **Drop-in / drop-out** | Players can join combat directly. [agent-decided · accepted] If one participant falls or leaves, the fight continues for those still fighting. Reset occurs only when all participants have fallen or left. |
| **Visible play (the bystander test)** | [agent-decided · accepted] Nearby players can recognize a cooperative fight from the enemy's readable telegraphs and the companion robot's visible support effects. Keep these signals in the world; add no interface markers or panels. |
| **Shareable play (the memorable moment)** | [agent-decided · accepted] The main shared moment is a village level-up: everyone receives the notice and sees the new building or visual transformation appear together. At cycle completion, every eligible participant also earns the same 100-coin reward and exclusive badge, including offline players at their next login. Personal XP and chest rewards still come from each player's own qualifying actions. |
| **Bring-a-friend** | [agent-decided · accepted] Friends can join the same fight without a party or invitation flow. Each progresses through their own qualifying actions and receives the existing collaboration bonus when eligible; inviting someone grants no separate reward. |

## 6. Mobile-First

**UI plan**

Display personal level progress, health and aura inside Alien Scrapyard's existing lower HUD panel. Preserve the panel's exact positions and dimensions: on a 1920×1080 canvas, desktop bottom 18/left 460 and size 1000×58; compact mobile bottom 14/left 304 and size 1312×78. Reorganize content inside this panel only. Health and aura use labeled or icon bars without numeric values; low-health feedback briefly flashes the health bar below 25%. If aura is insufficient, reuse the existing feedback area to show the missing amount. Add no HUD panel or control.

Show common advancement as a bar plus remaining category quantities, without a numerical village-point score. Reuse Alien Scrapyard's existing UI dimensions and on-screen positions, including menus. The owner reports that this layout is already optimized. Use the source implementation as the geometry reference while adapting menu content and visual style to this game.

## 7. World, Look & Story

[agent-decided · accepted] Across the floating islands, a civilization blends ancestral science, nature and alchemy through crystal-powered technology, runes and magic preserved in grimoires. Players gather resources, hunt hostile creatures and find treasure to grow their shared village beneath a great bioluminescent tree, while developing their own skills.

[agent-decided · accepted] Visual signature and wayfinding anchor: make the great bioluminescent tree stand out above the settlement and recognizable from nearby islands whenever the authored line of sight allows. Do not require it to be visible from every location; authored routes and island silhouettes provide the remaining visual guidance. Do not add interface markers.

[agent-decided · accepted] Use green accents for Explorer abilities, red for Warrior, blue for Mage and yellow for neutral village functions. These colors tint the village and its technology. The visual language combines natural forms with crafted crystal devices and ancestral runes, presenting science, alchemy and magic as parts of one civilization. In the launch game, abilities are learned through the personal skill board; one-use grimoires that teach abilities or apply a defined effect are reserved for a future expansion.

## 8. Audience & Comparables

**Primary player:** [agent-decided · accepted] A Decentraland visitor who enjoys light RPG progression and cooperative exploration, wants a useful short session, and can progress alone or join nearby players without forming a party.

**Comparables:** [agent-decided · accepted] Palia is a reference for a welcoming shared world, gathering and solo-or-friends play; Pandora differs through one automatically evolving common village and action-RPG combat. Dauntless is a reference for cooperative monster hunts and equipment progression; Pandora differs through always-open floating islands, shared resource delivery and settlement growth. ([Palia](https://palia.com/news/building-a-cozy-sim-mmo); [Dauntless](https://www.playstation.com/en-au/games/dauntless/))

**First group arrival:** [agent-decided] Aim to welcome Decentraland visitors arriving with friends or discovering the World together; the actual acquisition channel, expected concurrency and community size are TBD until deployment and promotion plans exist.

**Deliberately not for:** [agent-decided] Players seeking a solo, authored campaign with a fixed narrative ending, competitive PvP, or a player-run economy at launch. Pandora focuses on cooperative PvE, open-ended activity and shared settlement progression.

## 9. Delivery Plan & Scope

**Funding and schedule status:** TBD. The previous four-week wording in the inherited template is not a confirmed Pandora schedule. Decentraland's 2026 Season 1 call specified a milestone-based delivery of up to 90 days and closed on April 24, 2026; that call has passed. Do not treat its dates, terms or duration as applying to a future round. Reconfirm the next call before submitting. ([Season 1 call](https://forum.decentraland.org/t/regenesis-grants-program-season-1-now-open/25113))

**Proposed production sequence [agent-decided · planning outline, not a commitment]:**

| Stage | Intended outcome |
|---|---|
| Foundation | Confirm team, World target, asset rights, technical constraints, source reuse and funded scope. |
| Shared playable | Bring up the village, inherited menus/HUD, persistent player data, resource delivery and the common progress display. |
| Activity and progression | Add the three activity families, co-op combat, chests, coins, skill board, runes and shop using the defined rules. |
| World and cycle | Build the staged island content, village unlock sequence, feedback, onboarding and repeat-cycle rewards. |
| Release readiness | Optimize and verify desktop/mobile performance, persistence, accessibility, multiplayer edge cases, open-source delivery and documentation. |

No calendar durations are assigned because team size, existing Pandora implementation, funding scope and next-call milestones are not confirmed. Convert this sequence to dated milestones only after those facts are known.

**Scope cuts if delivery capacity is constrained [agent-decided]:**

1. Keep the common village, resource gathering/delivery and personal persistence; reduce island decoration and non-interactive set dressing first.
2. Keep one representative enemy per phase and defer additional enemy variants before removing direct cooperative combat.
3. Keep the shared cycle and personal skill progression; defer optional shop stock, cosmetic polish and expansion hooks before removing either progression track.

**Primary delivery risk:** The design contains a broad RPG system and three island phases, while team capacity and existing reusable implementation are not yet mapped. Reduce authored content and presentation variety before cutting one of the three activities or the shared-village loop. Performance thresholds and device matrix are TBD and must be set against current Decentraland requirements before production sign-off.




















































































[agent-decided · accepted] Defensive reductions apply sequentially to remaining damage in this order: Resilience formula, equipped Warrior passive, then Kinetic Shield. They do not add their percentages directly and cannot produce immunity. After all reductions, round final damage to the nearest whole point; an attack that hits always deals at least 1 damage. Rune effects do not add a separate damage-reduction layer in the initial game.

[agent-decided · accepted] Launch consumables are a health supply that restores 50% maximum health and an aura supply that restores 50% maximum aura. Each is consumed on use and may be used in combat. They share a 5-second item-use cooldown. No gathering tonic or protective amulet is in the launch design.

[agent-decided · accepted] Owner-approved initial town-coin milestones: automatically award 10 coins whenever lifetime collection crosses another 100 resource units, qualifying enemy defeats another 10, or personal treasure discoveries another 5 opened chests. These milestones repeat at every threshold and require no claim action. Shop prices are defined in `economy-and-items.md` and remain initial untested balance values.

[agent-decided · accepted] Inventory rules: carried resource quantities have no capacity limit. Using the village delivery point transfers every carried resource category in one action. Carried resources persist through defeat, logout and village-cycle reset. Consumable stacks and purchase limits use the inherited inventory system. Chest Supply Bundles enter the carried-resource inventory and require village delivery; personal runes use three equipped slots and an unlimited collection. Found runes may be sold; bought items cannot be resold.

[agent-decided · accepted] Ascension is the second Explorer active skill. The companion robot gives the character a vertical boost and brief controlled aerial movement, after which native paraglider travel can continue normally. All ranks cost 25 aura and have a 20-second cooldown. [agent-decided · accepted] Provisional ranks 1/2/3 provide 3/5/7 metres of vertical boost and 1.5/2/2.5 seconds of controlled aerial movement. Values are rank totals, not cumulative. The skill does not replace or gate the native paraglider.


[agent-decided · accepted] Phase Jump is the third Explorer active skill. The robot teleports the character only to eligible world travel points that the character has already visited; arbitrary coordinates are not allowed. All ranks cost 35 aura and have a 30-second cooldown. [agent-decided · accepted] Rank 1 reaches visited points on the current island; rank 2 also reaches visited points on directly connected islands; rank 3 reaches any visited eligible point in the world. Island-connection data and eligible point definitions come from level design. Exact world-point placement belongs to level design. [agent-decided · accepted] Once built at village level 9, the observatory opens a selectable list of the player's already visited points, filtered to the current Phase Jump rank. It does not unlock a point, cast the skill, waive its aura cost or cooldown, or reveal exact resource/treasure locations.


[agent-decided · accepted] Kinetic Shield is the second Warrior active skill. The companion robot creates a temporary personal barrier that reduces incoming damage. Apply it after Resilience and the equipped Warrior passive, reducing the remaining damage. [agent-decided · accepted] Provisional ranks 1/2/3 reduce the remaining incoming damage by 20%/30%/40% for 4/5/6 seconds. Every rank costs 25 aura and has an 18-second cooldown. Rank values replace one another; they are not cumulative. It protects only the user; group protection belongs to a later skill.


[agent-decided · accepted] Precision Shot is the third Warrior active skill. The floating robot fires directly at one hostile monster at range; the avatar performs no bow gesture. It deals physical damage based on the same Strength-scaled basic-attack formula, then applies its rank multiplier. Provisional ranks 1/2/3 deal 200%/275%/350% of basic-attack damage at 12/15/18 metres. Every rank costs 25 aura and has a 10-second cooldown. Rank values replace one another; they are not cumulative. Peaceful wildlife and allies cannot be targeted. Exact targeting assistance remains open.







## World content by phase

[agent-decided · accepted] Village levels 1–4 correspond to the initial phase, levels 5–8 to the intermediate phase and levels 9–13 to the advanced phase. These bands communicate difficulty and village development; they do not lock island access. Every island is physically explorable from the beginning, although advanced enemies are much more dangerous to new characters. Village buildings and their services appear automatically only when their assigned village level is reached.

[agent-decided · accepted] Confirmed village-state sequence: level 1 base camp/centre/delivery; 2 common storehouse; 3 communal shelter; 4 forest-settlement visual expansion; 5 infirmary/free recovery; 6 training ground; 7 storehouse and shelter expansion; 8 established-village transformation; 9 observatory; 10 communal monument; 11 monument and village expansion; 12 final village appearance; 13 cycle celebration, after whose completion the village returns to level 1. Numerical requirements remain separately tunable.

[agent-decided · accepted] Every nonzero category required by a village level must reach its own target before advancement. Delivered resources, enemy defeats and delivered chest supplies cannot substitute for one another. Each category contributes an equal capped fraction to the shared summary bar, while exact remaining quantities are shown by category. Required delivered resources and supplies are consumed on completion; surplus remains in the shared pool. Enemy requirements use fresh qualifying defeats for each level.

Owner revision: each opened chest grants its finder personal discovery credit, including treasure XP and counter progress. Every chest grants the finder a carried Supply Bundle that counts toward village needs only after delivery; rare and ancient chests may also grant personal runes. The finder alone receives the contents; nearby players receive no chest credit. Rune handling and chest drop odds are defined in [economy-and-items.md](economy-and-items.md) and [proposal-defaults.md](proposal-defaults.md).

[agent-decided · accepted] Treasure chests use the same 8-metre interaction range as resources. One press or tap opens a chest; holding is unnecessary. Preserve the inherited contextual prompt placement.

[agent-decided] Launch equipment consists of runes: three universal equipped slots plus unlimited personal rune storage. Each rune grants an attribute bonus and may grant at most one existing ability. The first three ability runes are Strength/Precision Shot (+1 Strength), Resilience/Boost (+1 Resilience), and Intelligence/Healing Pulse (+1 Intelligence); each ability remains available only while its rune is equipped and uses the existing active/passive slot, aura and cooldown systems. The basic shop sells predictable +1 attribute-only runes. Ability runes are personal rewards from Rare or Ancient chests, using the provisional chest odds summarized in `proposal-defaults.md`; common chests never drop runes. For a found rune, the opener chooses Equip/Store, Exchange with an equipped rune (the displaced rune returns to storage), or Sell; the chest disappears after the choice. Purchased items cannot be resold; duplicates remain separate. Preserve the inherited inventory window and UI geometry; do not add a new HUD panel.

[agent-decided · accepted] On opening a chest, show a brief notification in the inherited notification area with the Supply Bundle units and guaranteed coins received, update carried Supplies, and remind the player to deliver them at the village. If the chest also drops a rune, offer Equip/Store, Exchange or Sell inside the inherited inventory interface. Personal XP progress and treasure counter update for the opener only; show no numeric XP. The chest disappears for everyone after the opener resolves its contents.

Owner correction with accepted timing and [agent-decided · accepted] provisional counts: multiple chests of each available tier are active simultaneously for the shared world; the design never limits all players to one active chest of a tier. The forest island holds 6 active common chests across 12 eligible positions; the cave island holds 4 active rare chests across 8 positions; the ruins island holds 3 active ancient chests across 6 positions. Each common/rare/ancient chest independently respawns after 2/5/10 minutes and selects a currently free eligible position on its island. Two chests never occupy the same point. The observatory may identify the relevant island but never an exact chest position.

[agent-decided · accepted] The complete 13-level requirements table in `village-cycle.md` is the provisional balance baseline. It begins at level 1 with 40 wood, 20 stone, 30 fruit, 5 qualifying enemy defeats and 2 wealth; introduces iron and medicinal plants at level 5 and ancestral ore at level 9; and reaches level 13 requirements of 860 wood, 565 stone, 500 fruit, 350 iron, 190 plants, 85 ancestral ore, 100 enemy defeats and 42 delivered supply units. Every cycle repeats the same table. These quantities are an untested balance hypothesis and make no claim about completion time.

[agent-decided · accepted] Initial-phase launch catalogue: central village plus a physically connected forest island; fallen branches/wood, surface rocks/stone and wild-fruit bushes/fruit; peaceful birds and deer that cannot be harmed; one normal hostile plant creature, Root Prowler (Merodeador de raíces); a lost supply chest as common treasure; and the central gathering place, common storehouse and communal shelter. Available actions are gathering, combat and direct assistance, treasure discovery and deliver-all at the village. Gameplay roles are fixed; content names may change with later visual direction.

[agent-decided · accepted] Intermediate-phase launch catalogue: a rocky island with a cave network; iron veins and medicinal plants; Stoneback (Lomo de piedra) as an elite armoured enemy resistant to physical damage; Cave Warden (Custodio de la cueva) as a cooperative but solo-completable guardian; an ancient chest as rare treasure; and an infirmary plus training ground as automatic village additions. The infirmary provides free recovery. Practice awards no experience, resources, counters, milestones or village progress. All initial content remains available and necessary. Gameplay roles are fixed; names may change with visual direction.

[agent-decided · accepted] Advanced-phase launch catalogue: an ancient-ruins island; ancestral ore for final automatic village upgrades; Ruin Sentinel (Centinela de las ruinas) as a magic-resistant elite complementing the physically resistant Stoneback; Colossal Guardian (Guardián colosal) as the repeatable cooperative boss that remains solo-completable with sufficient progression; a relic chest as ancient treasure; and an observatory plus communal monument. From village level 9, the observatory opens a selectable list of the player's visited Phase Jump destinations, filtered by skill rank. It also identifies islands with an active guardian or special treasure, but never exact treasure or resource locations. The monument shows the current cycle, completed cycles and participant badges. Earlier content remains necessary. Gameplay roles are fixed; names may change with visual direction.

[agent-decided · accepted] The level-6 training ground provides indestructible practice targets for basic attacks and active abilities. They never attack players and never award XP, items or coins, advance activity counters or village needs, or count as enemy defeats. Active abilities still consume aura and observe their normal cooldowns.

[agent-decided · accepted] Provisional shared enemy population and respawn: the forest keeps 8 active Root Prowlers, each returning 30 seconds after defeat; the caves keep 5 Stonebacks at 60 seconds and 2 Cave Wardens at 3 minutes; the ruins keep 5 Ruin Sentinels at 90 seconds and one Colossal Guardian at 5 minutes. Each defeated creature respawns at an eligible position in its zone. Enemies remain available regardless of the current village phase. The Colossal Guardian is intentionally unique as the main community gathering encounter.

[agent-decided · accepted] Common enemy behaviour: hostile creatures detect and pursue nearby players; every damaging attack gives a brief readable telegraph so players can evade through movement. Enemies may change targets among participating players. If no participant remains inside the encounter zone for 8 seconds, the enemy returns to its home position and fully restores health. Defeat grants the accepted personal XP and shared defeat progress but drops no meat or gatherable resources; the defeat itself is its village contribution. Guardians and bosses follow the same rules and add area attacks.

[agent-decided · accepted] Enemy attack telegraphs remain readable and dodgeable with normal movement; no dedicated dodge action is required. Standard direct attacks warn for 0.9 seconds. Elite/guardian area attacks warn for 1.2 seconds. Colossal Guardian area attacks warn for 1.5 seconds and mark the impact zone visibly on the ground. Telegraphs use world visuals, not new HUD buttons.

[agent-decided · accepted] At the start of an enemy telegraph, lock the chosen target and impact location. A single-target warning clearly marks its chosen player; an area attack marks its fixed ground impact zone. Neither target nor area marker tracks player movement after the warning begins, so ordinary movement can evade the indicated attack.

[agent-decided · accepted] Enemy single-target attacks rotate among eligible recent combat participants, using the accepted 20-second contribution window. A solo player remains the sole target. No separate threat or taunt system is used. The Colossal Guardian follows the same target rotation.

[agent-decided · accepted] All hostile enemies detect a player within 10 metres and may pursue participating players up to 20 metres from their home position. If no participant remains within that 20-metre encounter boundary for 8 seconds, the enemy returns home and fully restores health. Basic attacks, skills and healing establish/refresh combat participation according to the accepted rules, even when initiated from farther away.

[agent-decided · accepted] Combat participation credit requires at least one point of actual damage to the enemy or at least one point of actual health restored to a current encounter participant; overhealing does not qualify. No minimum share of total damage is required. Eligibility lasts for 20 seconds after the player's most recent useful contribution. If the enemy falls during that window, the player receives full personal base XP, defeat-counter credit and cycle participation even if the player has fallen or moved away. After 20 seconds without a useful contribution, tagging alone grants nothing. The village still records the enemy defeat only once. When at least two distinct players qualify for the same defeat, each receives an additional collaboration bonus equal to 25% of that enemy's base XP; the bonus is fixed per player and does not scale with group size.

[agent-decided · accepted] Link Field grants its caster combat participation credit when an ally inside the field lands an attack that deals at least 1 actual point of bonus damage from the field. Each such qualifying hit refreshes the caster's 20-second participation window. The caster receives the normal enemy defeat reward only once, even if also dealing damage or healing. Maintaining a field without an ally benefiting from its damage bonus grants no combat credit.

[agent-decided · accepted] Provisional enemy combat values:

[agent-decided · accepted] Show a shared health bar above each enemy once combat begins. All players see the same current enemy health. The Colossal Guardian uses a more prominent health bar visible throughout its active encounter. Bars show remaining health without numeric values and refill fully if an encounter resets.

[agent-decided · accepted] When a player hits an enemy, show a brief hit flash/impact animation and visibly reduce its shared health bar. Do not show floating damage numbers; the health bar and impact effect provide combat feedback without clutter.

[agent-decided · accepted] Initial enemy attack patterns use the accepted enemy damage and telegraph values:

[agent-decided · accepted] Provisional attack cadence, measured between the starts of successive attacks and including each warning period: Root Prowler 3.5 seconds; Stoneback 4.5 seconds; Cave Warden 5.5 seconds, alternating frontal strike and circular pulse; Ruin Sentinel 4.5 seconds; Colossal Guardian 6 seconds, alternating stomp and sweep. Each enemy completes its current attack before beginning another. Values remain untested balance assumptions.

| Enemy | Attack pattern |
|---|---|
| Root Prowler | Short-range single-target swipe |
| Stoneback | Slow frontal charge |
| Cave Warden | Frontal strike and circular area pulse |
| Ruin Sentinel | Ranged single-target magic projectile |
| Colossal Guardian | Marked circular stomp and frontal sweeping wave |

No poison, stun or other status effects are part of the initial roster. Attacks remain dodgeable by normal movement.

| Enemy | Shared health | Base damage per hit | Trait |
|---|---:|---:|---|
| Root Prowler | 60 | 8 | Simple direct attack |
| Stoneback | 180 | 14 | Reduces incoming physical damage by 25% |
| Cave Warden | 500 | 18 | Frontal strike plus area attack |
| Ruin Sentinel | 240 | 16 | Reduces incoming magic damage by 25% |
| Colossal Guardian | 2,500 | 25 | Multiple telegraphed area attacks |

Enemy resistance applies only to its stated damage type. Shared enemy health never scales with participant count, so additional players always shorten the fight rather than making the enemy stronger. Values remain an untested balance hypothesis.

## Personal experience attribution

[agent-decided · accepted] Personal experience is awarded when the activity is performed, independently from village delivery. Collecting a valid resource unit awards experience immediately; qualifying participation in an enemy defeat awards experience when that enemy falls; finding and opening a treasure awards experience immediately. Dealing damage or providing actual combat healing qualifies as enemy participation under the accepted combat rules. Delivering resources advances the shared village but awards no second personal-experience payment for the same resources. Persistent personal counters separately track all resources collected, qualifying enemy defeats and treasures opened.

[agent-decided · accepted] The personal progression HUD shows the current personal level and a progress bar toward the next level, but no numeric XP total or fraction. Eligible actions visibly advance the bar. The existing profile shows exact lifetime activity counters for collected resource categories, qualifying enemy defeats and opened treasures, plus progress to the next coin milestone in each activity family. Resource milestone progress aggregates material types; enemy progress aggregates enemy types; treasure progress aggregates chest tiers. On personal level-up, the interface clearly announces the newly earned common skill point.

[agent-decided · accepted] Provisional hidden personal-XP awards: 1 XP per valid resource unit collected; 10 XP for a normal enemy, 25 for an elite and 60 for a guardian or boss; 15 XP for a common treasure, 40 for a rare treasure and 100 for an ancient treasure. Every qualifying combat participant receives the full enemy base award; it is never divided by the number of participants. If at least two distinct players qualify, each also receives 25% of the enemy's base XP as a collaboration bonus (2.5/6.25/15 XP respectively). The bonus does not scale with group size. Fractional XP is retained internally; the HUD still presents only level and bar progress, not numeric XP. When the collaboration bonus triggers, show “Bonus de colaboración” briefly in the inherited feedback panel, without its XP amount.

[agent-decided · accepted] Personal collection XP and lifetime counters use the number of resource units actually obtained after active yield bonuses. For example, collecting five base units plus two bonus units grants seven personal XP, records seven collected units and places seven units in carried inventory. This does not change the rule that later village delivery grants no duplicate personal XP.

[agent-decided · accepted] Every resource node yields five base units with one press or tap, regardless of resource type. Resource rarity comes from node count, placement and replenishment time rather than different base yields. Temporary yield bonuses apply after the five-unit base and all units actually received enter carried inventory, personal collection counters and personal XP under the accepted rules. Show the received quantity immediately.

[agent-decided · accepted] Resource-node discovery: nodes are recognizable parts of the environment and have no detector, map marker or skill reveal. Within the inherited interaction range, show the existing contextual interaction prompt. After collection, the node uses a visibly depleted/recovering state; no numeric countdown is shown. Preserve existing HUD and prompt placement.

[agent-decided · accepted] Resource gathering uses an 8-metre interaction range, matching the inherited Alien Scrapyard world-object click pattern. One press or tap within range gathers once; holding is unnecessary. Keep the existing contextual prompt placement.

[agent-decided · accepted] Provisional active node counts: forest — 8 wood, 6 stone and 6 fruit nodes; caves — 6 iron and 5 medicinal-plant nodes; ruins — 4 ancestral-ore nodes. These are shared active nodes per island; each becomes available again on its accepted resource respawn timer. Exact coordinates remain level-design work, and the counts are an untested map-density baseline.

[agent-decided · accepted] Provisional shared resource-node replenishment: wood, stone and fruit return 30 seconds after collection; iron and medicinal plants after 60 seconds; ancestral ore after 120 seconds. Collection depletes the node for every player. The depleted node retains a clear visual recovery state but shows no numeric countdown.

[agent-decided · accepted] Provisional personal-level curve: XP required to advance from the current level = 100 + 20 × (current level − 1). Therefore levels 1/10/30/50/98 require 100/280/680/1,080/2,040 XP to reach the next level, and advancing from level 1 to the maximum level 99 requires 104,860 XP in total. These values remain hidden behind the personal progress bar and are provisional balance values.

Owner decision: the initial maximum personal level is 99. The character starts at level 1 with one common skill point and continues earning one point per level through level 99. The 12-skill launch board requires 84 points to maximize. Any remaining points stay accumulated and visible as unspent skill points so the player can use them when future skills extend the board; they are not converted into another reward and are preserved through village cycles and board resets.

## Initial skill-board scope

[agent-decided · accepted] The initial skill board contains exactly 12 skills: three active skills and one passive skill for each of the Explorer, Mage and Warrior families. Players may learn and equip skills from different families in the same build; choosing a family does not lock the others. The maximum five active and five passive slots support mixed builds, although the initial board offers only three passive skills. Additional skills belong to future expansion rather than initial scope.

[agent-decided · accepted] All 12 initial skills are visible from the beginning. A player with an available common skill point may learn rank 1 of any skill without a family prerequisite. Ranks within each skill must be learned sequentially: rank 1 costs 1 point, rank 2 costs 2 additional points and rank 3 costs 4 additional points. No family choice locks another family and no preliminary class investment is required. Specialization emerges from where players spend points and which learned skills they equip.

[agent-decided · accepted] Players may reset their learned skill board for free only at the village centre and while outside combat. Resetting refunds every spent skill point, removes the attribute gains granted by the refunded ranks and recalculates Strength, Resilience and Intelligence from the new purchases. Personal level, accumulated experience and unlocked active/passive slot capacity remain unchanged. The reset cannot be performed from the islands or during combat.











































[owner revision · accepted] A chest Supply Bundle is carried by the finder and advances village needs only when delivered at the village centre. Rune rewards go directly to the finder's personal rune collection; the finder chooses whether to equip or sell a found rune. Supersedes direct-to-village credit for chest supplies.

[agent-decided · accepted] Chest Supply Bundles yield 1 supply unit from a common chest, 3 from a rare chest and 6 from an ancient chest. The finder carries these units in the unlimited resource inventory and delivers them with all other carried resources at the village centre; only delivery advances the shared Supplies requirement. Excess delivered supply units remain in shared surplus for later levels and cycles.

























