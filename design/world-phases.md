# Pandora — World catalogue proposal

Current skill direction: see [class-paths-proposal.md](class-paths-proposal.md). Resource detection and old class/title ladders are superseded. The three mixable branches are Explorer (movement), Mage (attack, healing and support) and Warrior (damage, defence and robot-fired ranged attacks). A floating companion robot executes abilities; see the current skill catalogue in that file and the GDD.

Status: [agent-decided · accepted] Owner accepted this catalogue as the provisional design baseline on 2026-09-20, explicitly allowing later changes. Content is not a final production commitment.
Owner decision, 2026-09-20: keep Pandora as the working name and define the world across initial, intermediate and advanced phases. These are content/progression bands, not a delivery schedule.

[Owner revision · 2026-10-04] The launch currency, milestone rewards, shop inventory, consumables and personal equipment are defined in [economy-and-items.md](economy-and-items.md) and [proposal-defaults.md](proposal-defaults.md). Older passages in this catalogue that describe crystals as currency, old consumables, cosmetics or non-rune equipment are superseded. Town coins are server-side story currency; physical crystals and grimoires are expansion content.

[Owner decision · 2026-10-04] Include the Forest, Caves and Ruins islands in the initial launch. All three are explorable from the start; their content and enemy difficulty follow the initial, intermediate and advanced village phases. This is a scope decision, not an access-gating rule.

## Phase mapping to the 13 village levels

[agent-decided · accepted] Village levels 1–4 correspond to the initial phase, levels 5–8 to the intermediate phase and levels 9–13 to the advanced phase. These bands communicate difficulty and village development; they do not lock island access. Every island is physically explorable from the beginning, although advanced enemies are much more dangerous to new characters. Village buildings and their services appear automatically only when their assigned village level is reached.

[agent-decided · accepted] Islands connect through authored physical jump-and-glide routes; mandatory bridges are not required. Make routes visually recognizable from the village and nearby islands; do not add interface markers. The direct-connection graph is Forest ↔ Caves ↔ Ruins, with no direct Forest–Ruins connection. This describes direct world connections, not access locks or a guaranteed route: every island remains explorable from the beginning and the native paraglider is always available. Exact geometry and glide distances remain level-design work.

## Shared rules

All world resources, enemies, discoveries and village buildings are shared. Character development, runes and skill choices are personal. Activity counters are always active; players never accept missions. There is no construction selection: buildings and services appear automatically with village progression. The three phases indicate content and difficulty, not island access; every island is physically explorable from the beginning, and earlier content remains useful.

Town coins are the personal shop currency, held server-side and awarded through enemy defeats, chests, fixed personal milestones and sale of eligible found runes. Milestones automatically award 10 coins at every 100 gathered units, 10 eligible defeats and 5 opened chests. The shop sells attribute-only runes, a health supply and an aura supply. Physical crystals, grimoires and cosmetics are outside launch scope.

One gather interaction, one combat system and one treasure interaction serve every phase. Skill choices stay in the personal board. No personal material crafting or manual building management.

## Initial — Forest and first settlement

[agent-decided · accepted] The initial-phase content catalogue is closed for launch scope. Content names may be revised later with the visual identity, without changing these gameplay roles.

| Category | Confirmed roster for this phase | Function |
|---|---|---|
| Places | Central village; physically connected forest island | Home, delivery hub and first open exploration area |
| Resource sources | Fallen branches; surface rocks; wild-fruit bushes | Wood; stone; fruit |
| Ambient fauna | Birds; deer | Peaceful world life; cannot be damaged or hunted |
| Hostile creature | Root Prowler (Merodeador de raíces) | Normal-tier hostile plant creature; provides no meat |
| Discovery | Lost supply chest | Common treasure; carried supplies delivered to the village |
| Village structures | Central gathering place; common storehouse; communal shelter | Deliver-all point; remaining-needs display; visible settlement growth |

Available actions are gathering, fighting, directly helping other players in combat, finding treasure and delivering every carried resource to the village. The central landmark is a large bioluminescent tree, with communal buildings around it; final name and logo remain open. The village is vegan. Wood, stone and fruit are resources; fruit provides food and meat is excluded. Chest Supply Bundles are carried to the village; runes are personal inventory.

## Intermediate — Caves and settled village

[agent-decided · accepted] The intermediate-phase content catalogue is closed for launch scope. Content names may be revised later with the visual identity, without changing these gameplay roles.

| Category | Confirmed additions | Function |
|---|---|---|
| Place | Rocky island with a cave network | Denser resources and tougher encounters |
| Resource sources | Iron veins; medicinal plants | Iron for automatic buildings; plants for village provisioning |
| Elite enemy | Stoneback (Lomo de piedra) | Armoured creature with increased resistance to physical damage; no food drop |
| Guardian enemy | Cave Warden (Custodio de la cueva) | Cooperative encounter protecting the shared rare treasure; remains solo-completable |
| Discovery | Ancient chest | Rare treasure; more carried supplies delivered to the village |
| Village structures | Infirmary; training ground | Infirmary restores full health free; indestructible targets test basic attacks/active skills, with no rewards or combat credit (skills still cost aura and use cooldowns) |

All initial-phase content remains available and necessary. Training awards no experience, resources, activity counters, milestones or village progress. Recovery and practice introduce no crafting menus and do not gate access to the personal skill board.

## Advanced — Ruins and established village

[agent-decided · accepted] The advanced-phase content catalogue is closed for launch scope. Content names may be revised later with the visual identity, without changing these gameplay roles.

| Category | Confirmed additions | Function |
|---|---|---|
| Place | Ancient ruins island | Strongest encounters and most valuable discoveries |
| Resource source | Ancestral ore deposits | Rare material for the final automatic village upgrades |
| Elite enemy | Ruin Sentinel (Centinela de las ruinas) | Magic-resistant enemy complementing the physically resistant Stoneback |
| Major boss | Colossal Guardian (Guardián colosal) | Main repeatable cooperative encounter; remains solo-completable with sufficient progression |
| Discovery | Relic chest | Ancient treasure; greatest carried supplies and possible runes |
| Village structures | Observatory; communal monument | Shows islands with an active guardian or special treasure, without revealing individual resources; displays current cycle, completed cycles and participant badges |

All earlier resources and activities remain necessary. No new crafting recipes, personal housing or player-selected construction projects are introduced.

Each opened chest grants its finder personal discovery credit, a Supply Bundle and guaranteed town coins. Supply counts toward common village needs only after delivery. Rare and Ancient chests may also grant a personal rune; Common chests never do. Runes have three equipped slots and unlimited storage. On finding one, the opener chooses Equip/Store, Exchange with an equipped rune (the displaced rune returns to storage), or Sell. Bought items cannot be resold. Nearby players receive no chest credit merely for being present. Current amounts, rune bonuses, coin values and drop odds are set in [economy-and-items.md](economy-and-items.md) and [proposal-defaults.md](proposal-defaults.md). Preserve the inherited inventory/menu geometry.

[agent-decided · accepted] Chest rewards and choice UI reuse the existing inventory and notification panels. Show Supply Bundle quantity and guaranteed coins; remind the finder that supplies count toward the village only after delivery. If a rune drops, show its attribute and ability and offer Equip/Store, Exchange or Sell. Personal XP and treasure-counter credit go to the opener only. The chest disappears for everyone after the choice.

## Shared lifecycle and reward proposal

[agent-decided · accepted] Provisional shared enemy population and respawn: the forest keeps 8 active Root Prowlers, each returning 30 seconds after defeat; the caves keep 5 Stonebacks at 60 seconds and 2 Cave Wardens at 3 minutes; the ruins keep 5 Ruin Sentinels at 90 seconds and one Colossal Guardian at 5 minutes. Each defeated creature respawns at an eligible position in its zone. Enemies remain available regardless of the current village phase. The Colossal Guardian is intentionally unique as the main community gathering encounter.

Owner correction with accepted timing and [agent-decided · accepted] provisional counts: multiple chests of each available tier are active simultaneously for the shared world; the design never limits all players to one active chest of a tier. The forest island holds 6 active common chests across 12 eligible positions; the cave island holds 4 active rare chests across 8 positions; the ruins island holds 3 active ancient chests across 6 positions. Each common/rare/ancient chest independently respawns after 2/5/10 minutes and selects a currently free eligible position on its island. Two chests never occupy the same point. The observatory may identify the relevant island but never an exact chest position.

Resource nodes deplete visibly for everyone and replenish automatically. Enemies share health and encounters; objective credit goes to eligible active participants. [owner revision · accepted] A chest opens with one press or tap. The finder receives personal discovery progress and a carried Supply Bundle to deliver at the village; some chests also grant personal equipment. Nearby players receive no discovery credit. The public chest becomes unavailable to everyone and respawns independently after its delay.

[agent-decided · accepted] Treasure chests use the same 8-metre interaction range as resources. One press or tap opens a chest; holding is unnecessary. Preserve the inherited contextual prompt placement.

## Totals and unresolved details

Complete proposed content: four locations including the village; six gather-source types; seven creature types; three treasure tiers; seven village structures. Shared delivery categories: wood, stone, fruit, iron, medicinal plants and ancient ore. Chest Supply Bundles form a separate shared requirement category and count only on village delivery; personal equipment is retained by the finder.

Before implementation, map exact source positions and remaining encounter details. Active source counts and respawn timing are provisionally set above. Balance is not claimed as tested.


[agent-decided · accepted] Provisional active node counts: forest — 8 wood, 6 stone and 6 fruit nodes; caves — 6 iron and 5 medicinal-plant nodes; ruins — 4 ancestral-ore nodes. These are shared active nodes per island; each becomes available again on its accepted resource respawn timer. Exact coordinates remain level-design work, and the counts are an untested map-density baseline.

## Confirmed gathering input

[agent-decided · accepted] Every resource node yields five base units with one press or tap, regardless of resource type. Resource rarity comes from node count, placement and replenishment time rather than different base yields. Temporary yield bonuses apply after the five-unit base and all units actually received enter carried inventory, personal collection counters and personal XP under the accepted rules. Show the received quantity immediately.

[agent-decided · accepted] Resource-node discovery: nodes are recognizable parts of the environment and have no detector, map marker or skill reveal. Within the inherited interaction range, show the existing contextual interaction prompt. After collection, the node uses a visibly depleted/recovering state; no numeric countdown is shown. Preserve existing HUD and prompt placement.

[agent-decided · accepted] Resource gathering uses an 8-metre interaction range, matching the inherited Alien Scrapyard world-object click pattern. One press or tap within range gathers once; holding is unnecessary. Keep the existing contextual prompt placement.

[agent-decided · accepted] Provisional shared resource-node replenishment: wood, stone and fruit return 30 seconds after collection; iron and medicinal plants after 60 seconds; ancestral ore after 120 seconds. Collection depletes the node for every player. The depleted node retains a clear visual recovery state but shows no numeric countdown.

Gathering is one press or tap within 8 metres, yields five base units and depletes the shared node; holding is unnecessary. Provisional replenishment: wood, stone and fruit 30 seconds; iron and medicinal plants 60 seconds; ancestral ore 120 seconds.

## Basic combat input

[agent-decided · accepted] The companion robot executes the basic attack as a physical projectile. One press or tap fires once at a hostile target within 6 metres, with a minimum 1-second interval between shots, no automatic repetition and no aura cost. Damage uses the accepted formula 10 + Strength gained above the starting value. Light targeting assistance selects the hostile enemy nearest the centre of the screen within range. Peaceful fauna and players are never valid targets. Precision Shot remains distinct through its 12/15/18-metre range and rank damage multipliers.

[agent-decided · accepted] Common enemy behaviour: hostile creatures detect and pursue nearby players; every damaging attack gives a brief readable telegraph so players can evade through movement. Enemies may change targets among participating players. If no participant remains inside the encounter zone for 8 seconds, the enemy returns to its home position and fully restores health. Defeat grants the accepted personal XP and shared defeat progress but drops no meat or gatherable resources; the defeat itself is its village contribution. Guardians and bosses follow the same rules and add area attacks.

[agent-decided · accepted] Enemy attack telegraphs remain readable and dodgeable with normal movement; no dedicated dodge action is required. Standard direct attacks warn for 0.9 seconds. Elite/guardian area attacks warn for 1.2 seconds. Colossal Guardian area attacks warn for 1.5 seconds and mark the impact zone visibly on the ground. Telegraphs use world visuals, not new HUD buttons.

[agent-decided · accepted] At the start of an enemy telegraph, lock the chosen target and impact location. A single-target warning clearly marks its chosen player; an area attack marks its fixed ground impact zone. Neither target nor area marker tracks player movement after the warning begins, so ordinary movement can evade the indicated attack.

[agent-decided · accepted] Enemy single-target attacks rotate among eligible recent combat participants, using the accepted 20-second contribution window. A solo player remains the sole target. No separate threat or taunt system is used. The Colossal Guardian follows the same target rotation.

[agent-decided · accepted] All hostile enemies detect a player within 10 metres and may pursue participating players up to 20 metres from their home position. If no participant remains within that 20-metre encounter boundary for 8 seconds, the enemy returns home and fully restores health. Basic attacks, skills and healing establish/refresh combat participation according to the accepted rules, even when initiated from farther away.

[agent-decided · accepted] Combat participation credit requires at least one point of actual damage to the enemy or at least one point of actual health restored to a current encounter participant; overhealing does not qualify. No minimum share of total damage is required. Eligibility lasts for 20 seconds after the player's most recent useful contribution. If the enemy falls during that window, the player receives full personal XP, defeat-counter credit and cycle participation even if the player has fallen or moved away. After 20 seconds without a useful contribution, tagging alone grants nothing. The village still records the enemy defeat only once.

[agent-decided · accepted] Link Field grants its caster combat participation credit when an ally inside the field lands an attack that deals at least 1 actual point of bonus damage from the field. Each such qualifying hit refreshes the caster's 20-second participation window. The caster receives the normal enemy defeat reward only once, even if also dealing damage or healing. Maintaining a field without an ally benefiting from its damage bonus grants no combat credit.

One press or tap fires a physical robot projectile at the hostile target nearest the screen centre within 6 metres, with at least one second between shots. Damage is 10 plus gained Strength; no automatic repetition or aura cost. Peaceful fauna and players cannot be targeted.




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

[agent-decided · accepted] Health recovery: once the character is outside combat under the accepted 8-second combat-state rule, health regenerates at 2% of maximum health per second. Taking damage or re-entering combat stops this recovery. The unlocked infirmary restores full health immediately and free of charge. Plant-based potions remain distinct because they may be used during combat. Defeat returns the player to the village at full health while preserving the already accepted progression, carried resources and items.

## World traversal

Physical island geometry and connections remain level-design work. The native paraglider is always available as a Decentraland control and is not a game unlock or skill requirement. Explorer progression complements traversal with robot-assisted speed, aerial ascent and Phase Jump to already visited eligible travel points. Phase Jump rank controls same-island, directly connected-island or any visited-point destinations.


## Skill controls

Basic attack plus active and passive skill slots, each set growing to a maximum of five. Only equipped passives apply. Personal levels 1/5/10/20/30 unlock 1/2/3/4/5 active and passive slots automatically without point cost; unlocks persist through village cycles. The skill UI preserves the established positions and dimensions, keeps all slots fixed, and dims locked slots.

## Superseded initial active skills — historical proposal

[agent-decided · accepted] Historical roster below; current capacity grows to five active and five passive slots. Each has a cooldown. Owner revision: active skills now consume a personal aura bar; the earlier no-resource rule is superseded.

| Branch | Skill | Effect |
|---|---|---|
| Explorer | Tracking | Temporarily reveals nearby resources and treasures. |
| Warrior | Powerful Strike | An attack with increased damage. |
| Mage | Healing | Restores health to the user and nearby allies. |

Historical proposal only; current robot-assisted active skills and their effects, ranges, durations and cooldowns are defined in [class-paths-proposal.md](class-paths-proposal.md) and the current GDD sections. Ranks cost 1, 2 and 4 skill points.

## Superseded passive skills — historical roster

[agent-decided · accepted] Current rule: learned passives require passive slots and apply automatically only while equipped.

| Branch | Passive effect |
|---|---|
| Explorer | More resources collected per interaction. |
| Warrior | Higher maximum health. |
| Mage | More health restored by Healing. |

Historical proposal only; the current Explorer speed, Warrior damage reduction and Mage aura-regeneration passives and their rank effects are defined in [class-paths-proposal.md](class-paths-proposal.md) and the current GDD sections. Ranks cost 1, 2 and 4 skill points.

## Earlier six-skill progression — roster superseded

Historical roster superseded. The current launch board has twelve skills across three mixable branches, with three ranks per skill costing 1/2/4 points. Current abilities and effects are listed in the GDD and [class-paths-proposal.md](class-paths-proposal.md); village level does not gate personal skills.



[agent-decided · accepted] Inventory rules: carried resource quantities have no capacity limit. Using the village delivery point transfers every carried resource category in one action. Carried resources persist through defeat, logout and village-cycle reset. Consumable stack limits follow the inherited inventory system. Chest Supply Bundles enter the unlimited carried-resource inventory and require village delivery; personal equipment is rune-based with three equipped slots and unlimited storage.

## Launch shop products

[superseded by economy-and-items.md] Earlier proposed potion, gathering tonic and protective amulet effects are not launch items. Launch consumables are one health supply and one aura supply; both restore 50% of the matching maximum and are usable in combat.

[owner-approved initial balance] Town-coin milestones award 10 coins automatically at each 100 lifetime gathered units, 10 eligible defeats and 5 opened chests. Counters repeat and persist. The player shop uses coins; see [economy-and-items.md](economy-and-items.md) for approved prices and effects.

[owner-approved direction] Reuse Alien Scrapyard shop and inventory geometry and server-backed logic. Buy with town coins. Permanent skills remain on the skill board; physical crystals and grimoires are reserved for expansion.

| Product | Initial price | Effect |
|---|---:|---|
| Health supply | 10 coins | Restores 50% maximum health; one use, including in combat. |
| Aura supply | 10 coins | Restores 50% maximum aura; one use, including in combat. |
| Attribute rune | 25 coins | +1 to the named attribute; no ability. |

Health and aura supplies are the only launch consumables; runes are personal equipment. Use the inherited inventory/menu and quick-use slots without adding HUD controls or moving existing UI. Cosmetics are outside launch scope.



## Starting character — initial skill choices superseded

[agent-decided · accepted] Basic attack and gathering are available immediately. Start with one skill point, before the first level-up, to learn rank 1 of Tracking, Powerful Strike or Healing. Each of these initial active-skill choices costs one point. Each later level-up grants one point; skill ranks cost 1, 2 and 4 points.

[agent-decided · accepted] The initial point is shown through a discreet available-point notice. The skill board does not open automatically; spending the point is optional and never blocks exploration. Preserve the inherited UI geometry.

## Personal experience

[agent-decided · accepted] Gathering, treasure discovery and eligible combat participation automatically grant XP. XP advances personal levels; level-ups grant common skill points. Personal activity milestones grant town coins, not crystals. Provisional XP amounts and the level-99 curve are defined in the GDD; combat eligibility uses the shared 20-second useful-contribution rule.







Current confirmed passive roster: Explorer movement speed; Warrior incoming-damage reduction; Mage aura regeneration. Effects require equipped passive slots. See class-paths-proposal.md for current skill rules.


[agent-decided · accepted] Defensive reductions apply sequentially: Resilience formula, Warrior passive, then Kinetic Shield. After all reductions, round to the nearest whole point; any successful enemy hit deals at least 1 damage. Mitigation cannot grant immunity.






























[owner revision · accepted] A chest Supply Bundle is carried by the finder and advances village needs only when delivered at the village centre. Equipment rewards go directly to the finder's personal equipment inventory. Supersedes direct-to-village credit for chest supplies.

[agent-decided · accepted] Chest Supply Bundles yield 1 supply unit from a common chest, 3 from a rare chest and 6 from an ancient chest. The finder carries these units in the unlimited resource inventory and delivers them with all other carried resources at the village centre; only delivery advances the shared Supplies requirement. Excess delivered supply units remain in shared surplus for later levels and cycles.

























