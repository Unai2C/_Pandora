# Pandora — proposed launch defaults

**Status:** the owner approved the proposed launch balance defaults on 2026-10-04. Values remain untested and may be tuned; non-numeric proposals and open questions remain marked separately.

## The established design

- Three always-open activities: gather shared resources, fight hostile creatures, and find/open treasure. Personal objectives count automatically; no accepting quests. The village is a shared 13-level loop and grows automatically.
- Shared resource deliveries and enemy defeats advance the common village needs. Players see one shared progress bar and remaining amounts per required category, not village points. Personal XP, skills and inventory are separate.
- The main routes connect the Forest, Caves and Ruins; islands are explorable from the start, physical routes are authored, and Decentraland's paraglider is always available.
- Personal growth uses the Explorer, Warrior and Mage branches, Strength, Resilience and Intelligence, the floating companion robot, an aura pool, and active/passive skill slots. Skill-board abilities are permanent. Rune-granted abilities exist only while the rune is equipped.
- Balance the 13-level village cycle around approximately four regular contributors; this is a planning baseline, not a player cap or entry requirement. Players may join at any time and contribute immediately. Target roughly two weeks per cycle, with no deadline. Each eligible contributor receives 100 town coins and an exclusive cycle badge; eligibility requires at least one resource/supply delivery or qualifying enemy-combat contribution during that cycle. Deliver the reward automatically at next login if the player is offline at completion. The 100-coin amount is an approved initial balance value, not playtested.
- UI panels, menus and on-screen positions reuse Alien Scrapyard's optimized geometry. Town coins are server-side story currency only; there is no blockchain token. Physical crystals and one-use grimoires are expansion content, outside the initial game.
- Health and aura supplies use the two existing quick-use HUD slots, preserving their positions and dimensions; both share the approved 5-second use cooldown.

## Owner-approved launch economy defaults — untested balance

Keep the current four coin routes: direct enemy rewards, chest rewards, automatic personal-objective milestones, and selling found personal items. Coins belong to the player and buy shop items; village resources and Supply Bundles never become personal money. Objectives are always active and require no quest acceptance.

| Event | Proposed launch payout | Rule |
|---|---:|---|
| New character starting balance | 0 coins | First earnings come from play; shop purchases wait until the player earns coins. |
| Normal enemy defeat | 2 coins [owner-approved] | Per qualifying contributor, using the existing useful-contribution rule. |
| Elite enemy defeat | 5 coins [owner-approved] | Per qualifying contributor. |
| Guardian / boss defeat | 15 coins [owner-approved] | Per qualifying contributor. |
| Common chest | 5 coins | Guaranteed to the finder. |
| Rare chest | 15 coins | Guaranteed to the finder. |
| Ancient chest | 30 coins | Guaranteed to the finder. |
| Gather 100 lifetime resource units | 10 coins | Automatic personal objective; gather rewards are otherwise not paid per node. |
| Defeat 10 eligible enemies | 10 coins | Automatic personal objective, in addition to direct defeat rewards. |
| Open 5 treasure chests | 10 coins | Automatic personal objective, in addition to any chest contents. |
| Sell a found rune | 5 / 10 / 20 / 40 coins | Common / Rare / Epic / Legendary salvage value. Shop purchases cannot be resold. |

Objective milestones repeat at each threshold and counters never reset. [owner-approved] When two or more players qualify for an enemy reward, each receives a 25% bonus on their direct coin payout, matching the existing XP collaboration rule. Each player receives an individual award; the payout is not split from a shared pool. No coin award advances village needs a second time.

## Owner-approved shop and rune defaults — untested balance

| Shop item | Proposed price | Proposed effect |
|---|---:|---|
| Strength rune | 25 coins | +1 Strength; attribute-only rune. |
| Resilience rune | 25 coins | +1 Resilience; attribute-only rune. |
| Intelligence rune | 25 coins | +1 Intelligence; attribute-only rune. |
| Health supply | 10 coins | Restore 50% of maximum health; one use, including in combat. |
| Aura supply | 10 coins | Restore 50% of maximum aura; one use, including in combat. |

The shop sells predictable attribute runes only. Chests may award runes that grant at most one ability from the existing skill catalog, plus their attribute bonus. Any rune fits any of the three equipped slots. Unequipped rune storage is unlimited; duplicates remain separate copies. Replacing a rune returns the old one to storage. Found runes can be sold, including duplicates; purchased items cannot be resold.

Reuse Alien Scrapyard's two quick-use HUD slots for the health and aura supplies, at exactly the existing screen positions and dimensions [agent-decided]. Use the approved five-second shared consumable cooldown; restoration and prices are initial balance defaults, not playtested.

Keep the current chest supply contribution baseline: common/rare/ancient chests carry 1/3/6 Supply Bundle units for delivery. Retain the existing rarity odds as a provisional starting point, adapting equipment drops to runes: common chests have no rune drop; rare chests have a 25% Rare-rune chance; ancient chests have a 70% rune chance split 60% Rare, 30% Epic and 10% Legendary. These odds are inherited proposals, not confirmed balance.

## Other useful defaults already in the design files

- Resource nodes yield 5 units per press; interaction range 8 m; shared respawn is 30 seconds for wood/stone/fruit, 60 seconds for iron/medicinal plants and 120 seconds for ancestral ore.
- Provisional active node counts: Forest 8 wood, 6 stone, 6 fruit; Caves 6 iron, 5 medicinal plants; Ruins 4 ancestral ore.
- Basic robot projectile: 10 damage plus gained Strength, 6 m range and at least 1 second between shots. Hostile enemies warn before attacks; ordinary movement is the dodge.
- Eligible enemy XP: 10 / 25 / 60 for normal / elite / guardian-or-boss, plus 25% per-player XP when at least two people qualify. Credit lasts 20 seconds after useful damage, healing or Link Field support.
- Each character level awards one skill point. Skill ranks cost 1, 2 and 4 points. The personal level cap is 99; unused points accumulate. Active and passive slots each grow to a maximum of five.
- Village cycle values, seven structure unlocks, enemy stats, attack cadence, chest counts and respawn times are recorded in `village-cycle.md` and `world-phases.md`. Treat their numerical values as untested starting balance; do not claim a cycle duration.
- The village requirement table grows through 13 levels in three bands (1–4 initial, 5–8 intermediate, 9–13 advanced); each required category must be met, and excess stock carries forward. The state and structure sequence are listed level by level in `village-cycle.md`.
- Personal progression starts at level 1, caps at 99 and grants one skill point per level-up, plus the accepted initial point. Skill ranks cost 1/2/4 points. Active and passive capacity unlocks at levels 1, 5, 10, 20 and 30, up to five slots each. The XP curve and attribute-growth table are still provisional.

## Biggest open questions

1. **Economy validation:** all launch default amounts in this proposal are approved. The remaining uncertainty is whether those amounts feel balanced in actual progression; no tests are requested in this document-design phase.
2. **Rune catalogue:** the initial Strength → Precision Shot, Resilience → Boost and Intelligence → Healing Pulse mappings are decided; each ability rune also grants +1 to its matching attribute. Ability runes drop only from Rare or Ancient chests, using the existing provisional chest odds. Rune abilities use existing active/passive capacity. The +1 and drop rates are initial untested balance values.
3. **Village balance:** cycle planning assumes about four regular contributors and targets roughly two weeks. Actual completion time and the resource requirements need validation; they are not deadlines or measured forecasts.
4. **Production scope:** all three islands and the phase-based content catalogue are included in the initial design scope. Team capacity, exact final asset counts, technical limits and the delivery schedule remain TBD.
5. **First session and return:** the player promise, primary player and first-minute flow are captured, but clarity and D1 return effect are unmeasured. H1-02 remains parked; no tests are requested in the current document-design phase.
6. **Proposal identity and production:** public title/logo are intentionally postponed; target World or coordinates, team/contact details, next funding call and dated delivery milestones remain open. The 2026 Season 1 call has passed; do not carry its schedule into a future round. The two comparables, primary player and creator motivation are now captured.

## GDD consistency note

Historical material in `world-phases.md` and `gdd.md` may still describe crystals as currency, obsolete consumables or non-rune equipment. The current launch rules in `economy-and-items.md` supersede those passages; remove any surviving contradictory history before submission.
