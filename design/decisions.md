# Design decisions

2026-09-18 · Owner · Create a new collaborative Decentraland game using development experience from Alien Scrapyard.
2026-09-18 · Owner · Island exploration, treasure hunting, resource gathering and defeating enemies feed village expansion.
2026-09-18 · Owner · Include both settlement development and individual RPG progression through levels and abilities.
2026-09-18 · Owner · Reuse Alien Scrapyard UI dimensions and on-screen positions, including menus. The owner identifies this layout as already optimized. Preserve its geometry when adapting content and visual style.
2026-09-18 · Owner · Develop the design alongside playable tests.
2026-09-18 · Owner · Reuse Alien Scrapyard's underlying game framework (the same "brain"), including crystal accounting, shop and related systems. Together with the existing UI constraint, this makes Alien Scrapyard the technical starting point for the new game.
2026-09-18 · Implementation interpretation · Adapt the existing server, client/server messages, player profiles, inventory, equipment and progression to the cooperative game. Reusing systems does not decide new item prices, reward amounts or expedition rules, nor does it authorize sharing live player balances between games.

## Source evidence and reuse candidates

Reviewed source: `C:/Users/Imagine To Create/Desktop/dcl_alienscrapyard/Alienscrap-main/Alienscrap-main`.

- `src/shared/progression.ts`: level thresholds and title mapping exist. These are candidates for adaptation; balance does not transfer automatically.
- `src/server/storage/playerProfile.ts`: stored profiles include XP, levels, resources, artifact inventory, equipment and tutorial state, with schema normalization.
- `src/server/alienServer.ts`: player profile loading, saving, equipment handling and periodic persistence exist.
- `src/server/alienServer.ts`, `src/shared/alienMessages.ts`, `src/systems/artifactShop.ts`: the shop opens the existing UI and sends purchase requests to server logic that spends profile crystals and updates inventory. Its round-specific purchase restrictions need adaptation to the new game.
- `design/decisions.md`: Alien Scrapyard explicitly prioritizes competition. This project's cooperative intent requires new social rules.
- `design/hypothesis-log.md`: retention, cooperation-adjacent social assumptions and mobile claims are not established evidence for this game; the source log contains parked tests.

No source code has been copied. New-game implementation and reuse validation have not started. Session mode: design with playable tests. Funding application scope has not been requested.

2026-09-18 · Owner · The new game's working folder is C:/Users/Imagine To Create/Desktop/dcl/_Pandora. Previous design documents were copied here; this location is authoritative from now on.
2026-09-18 · Owner · Expeditions support three activities: gather resources, hunt or defeat enemies, and find treasures. No single activity has been selected as the dominant one.
2026-09-18 · Owner · Players can bring food to the village. Treasures increase village wealth. Materials such as iron and wood enable new buildings.
2026-09-18 · Pending · Expansion costs, the effect of village wealth, building recipes, contribution rules and how village wealth relates to personal crystals remain undecided.

2026-09-18 · [agent-decided · accepted] · Food is consumed when expanding the village, not continuously by inhabitants · Owner selected expansion spending after considering ongoing upkeep. Specific expansion costs and population rules have not been decided.
2026-09-18 · Owner · One common village for all players · Village development is shared; the previously requested character levels and abilities remain individual. Construction selection and contribution rules are still open.
2026-09-18 · Owner · Players choose which construction project to support from a small set · Initial progression: village level 1 offers one project, level 2 offers two and level 3 offers three. Later counts and any cap remain undecided. This resolves the earlier open construction-selection question; level-up conditions remain open.
2026-09-18 · Owner · Village levels require a common point target earned through missions plus completion of all required buildings for that level · This resolves the earlier open level-up rule; exact thresholds and required buildings remain undecided.
2026-09-18 · Owner · Quests are individual and advance the character while adding to a common village objective.
2026-09-18 · Owner · Personal skill development counts performed activity independently from donations · Gathering 340 wood still counts as 340 gathered for character development when only 100 is delivered. No XP or village-point conversion rate was specified.
2026-09-18 · Owner · Include an RPG skill board where actions support earning points and learning new abilities · Mage, warrior and explorer are suggested directions; exclusive classes versus mixable branches remains open.
2026-09-18 · [agent-decided] · Choose mixable explorer, warrior and mage branches after owner delegated the choice · No permanent class selection; a player can develop all branches.
2026-09-18 · [agent-decided] · Use activity-based branch progression and branch-specific learning points · Gathering and treasure discovery develop explorer, weapon combat develops warrior, magical ability use develops mage. Each branch must provide a basic action before its first unlock. Exact actions, costs and tuning remain open.
2026-09-18 · [agent-decided] · Track general character level, branch development, current inventory and village points separately · Spending or donating resources must not erase lifetime activity progress. No numerical conversion rates have been selected.
2026-09-18 · Owner · Keep the game simple: delivery transfers all carried expedition resources and the village manages them · Supersedes partial donations and the earlier 340 gathered / 100 delivered example. Personal activity progression remains earned after delivery. The proposed personal material crafting/tool-upgrade economy is not adopted.
2026-09-18 · [agent-decided] · Interpret village management as a shared stockpile with automatic resource allocation · Keep the previously requested small project choice as a preference rather than manual resource splitting. Exact allocation priorities remain open. Existing personal crystals, equipment and shop systems are not redefined by this expedition-resource rule.
2026-09-18 · Owner · The village develops automatically along a preprogrammed path; new levels add buildings with activities · No construction selection, priorities, manual allocation or village-management decisions. Choices belong in personal skill boards. Supersedes the one/two/three project-choice rule and the assistant's proposed priority selection.
2026-09-18 · Pending · Reconcile the earlier all-buildings-complete level gate with automatic buildings unlocked on level-up · Exact programmed sequence and resource consumption remain to be designed; do not introduce a circular unlock requirement. Common mission progress and individual skill progression remain in scope.
2026-09-18 · Owner · Emphasize collaboration as a core design priority · Individual development must connect to common village progress while village management stays automatic.
2026-09-18 · [agent-decided] · Make the common objective, outstanding needs and recent contributors visible within the inherited UI · Shared building activities benefit everyone; recognize contributions without turning them into a competitive ranking. Direct expedition cooperation remains to be decided and tested.
2026-09-18 · [agent-decided · accepted] · Direct combat assistance without forming a party · Owner accepted that players can join another player's fight and both advance their relevant individual quests.
2026-09-18 · [agent-decided] · Use participation-based quest credit rather than final-blow ownership · The exact qualifying contribution, XP, loot and solo difficulty rules remain open for testing.
2026-09-18 · Owner feedback · Owner reports having tested direct combat assistance and liking it ("ya esta probado y si está chido") · Keep cooperative combat in the design. The tested build and session are not yet identified: the separate prototype task was still active and no experiment file was present when checked. This records owner feedback, not measured technical validation or a closed experiment verdict.
2026-09-20 · Owner · Finish designing the whole game before further tests; use familiar mechanics as the working basis · Session is document-only from this point. Do not initiate more prototype or playtest detours. This supersedes the earlier interleaved design/testing workflow; it does not invent measured balance results.
2026-09-20 · Owner · Include both free exploration across the scene and bounded mission experiences · Some things are found in the open scene; other missions have a defined beginning and end. Private instances, mission entry, objectives, failure, duration and participant rules are not yet specified.
2026-09-20 · [agent-decided] · All bounded missions are completable solo, with optional cooperation and no mandatory group size · Owner delegated this choice. This keeps mission access available during quiet hours while supporting direct help and individual quest progress for active participants. Exact difficulty, rewards and participant limits remain to be designed.
2026-09-20 · [agent-decided · accepted] · Defeat returns the player to the village, preserving earned experience and carried resources; the unfinished encounter resets for a retry · Owner accepted this mild penalty. The effect on surviving cooperative participants remains open; no shared encounter reset rule has yet been chosen.
2026-09-20 · [agent-decided · accepted] · A shared encounter continues while anyone remains fighting and resets only when all participants have fallen or left · Owner accepted this rule. It resolves the earlier open effect of individual defeat on surviving cooperative participants.
2026-09-20 · Owner · Simplify missions into fixed, always-active personal objectives that accumulate actions automatically, such as stones activated and animals hunted · Everything is open without accepting missions. Supersedes the proposed quest board, mission selection and separate closed-mission flow. Keep free exploration, personal development and common village progress.
2026-09-20 · Current design boundary · Existing activities are freely accessible; earlier automatic village buildings remain in the design. Their future services and objective thresholds still need definition without reintroducing mission acceptance.
2026-09-20 · Owner · The village has a center; decide its form later · Tree versus sanctuary is postponed. The proposed bundle of spawn, defeat return and resource delivery at that center has not been explicitly confirmed.
2026-09-20 · [agent-decided · accepted] · Fixed objectives use cumulative milestones, with no counter reset · Each newly reached milestone provides personal progression and points to the common village objective. Owner accepted this structure. Thresholds and reward quantities remain undecided; 5/15/30 were illustrative only.
2026-09-20 · Owner · Start with crystal activation, monster hunting, resource collection and treasure collection; count categories separately · Named resources include wood, meat and wild fruit.
2026-09-20 · Owner · Internal points summarize all required contributions, but the player sees only a common progress bar and missing category quantities · No numerical village-point score; the required mix must be completed.
2026-09-20 · [agent-decided] · Cap each category's weighted contribution to the bar at its requirement · Prevent surplus in one category from replacing another or making a full bar appear before all needs are met. Personal lifetime counters remain independent. Resource credit timing (collection versus delivery), weights, quantities and surplus carryover remain open.
2026-09-20 · [agent-decided · accepted] · Resource collection advances personal progression; delivery advances shared village resource requirements; non-delivery actions such as crystal activation count immediately · Owner accepted this distinction. Village resource progress is not awarded both on collection and delivery.
2026-09-20 · [agent-decided · accepted] · Surplus delivered resources stay in the common stockpile and apply automatically to subsequent village levels · Owner accepted this rule so contributions remain useful after a category is full. Exact level requirements and consumption quantities remain undecided.
2026-09-20 · Owner · Keep Pandora as the working name and define world content in three phases: initial, intermediate and advanced.
2026-09-20 · [agent-decided] · Draft a complete bounded world catalogue in world-phases.md · All specific content names, rosters and functions are proposals. Phase labels indicate progression and difficulty rather than mission acceptance or closed access. Proposed removal of activatable crystals remains unconfirmed; existing shop currency is a separate question.
2026-09-20 · [agent-decided · accepted] · Owner accepts the three-phase world catalogue as a provisional baseline, with later modifications expected · Includes the listed locations, resources, creatures, treasures, buildings and functions, shared-world lifecycle and removal of activatable world crystals. Shop currency remains open. No final production scope or balance commitment is implied.
2026-09-20 · Owner · Gather resources with one press/tap, not a held input · Applies to the resource interaction; combat inputs remain a separate design decision.
2026-09-20 · [agent-decided · accepted] · Basic combat uses one press/tap per attack, a short attack interval and free movement · Owner selected the recommended manual-attack option over automatic repetition. Exact timing, damage, range, targeting and enemy patterns remain open.
2026-09-20 · Owner · Include non-attacking huntable animals, such as birds and deer, alongside combat enemies · Replaces the generic initial wild grazer with birds and deer in the provisional catalogue. Movement, fleeing, health, hunting rewards and enemy attack patterns remain undecided.
2026-09-20 · Owner · The village is vegan · Remove meat and animal-derived food from the current economy; existing wild fruit supplies initial food. Supersedes the earlier meat needs and food hunting proposal.
2026-09-20 · [agent-decided] · Keep birds and deer as peaceful ambient wildlife rather than hunting targets · Preserve monster combat as a separate activity, with no meat rewards. Additional plant-food types and monster rewards remain undecided.
2026-09-20 · [agent-decided · accepted] · Treasure chests open with one press/tap, grant wealth directly to the village and exploration progress to the discoverer · No carried treasure or delivery. The shared chest becomes unavailable and respawns later. This supersedes previous treasure transport/delivery proposals; gathered resources still require delivery.
2026-09-20 · Owner · Connect islands physically through world design, including jumps with a paraglider · Routes and traversal details remain to be designed; teleportation is only a possible skill-dependent addition.
2026-09-20 · Owner · The paraglider belongs to Decentraland controls and is always available · Record as owner-stated platform baseline. Design physical traversal around it; no game-specific unlock, purchase or skill gate. Supersedes the earlier open availability question. Proposed skill upgrades to its range/control were not accepted.
2026-09-20 · [agent-decided · accepted] · Character level-ups grant common skill points that can be invested in any of the three branches · Owner chose this recommendation over activity-locked branch points. Supersedes branch-specific point currencies and the requirement to practise magic before unlocking it. Activity counters remain independent; exact skills, point quantities and costs remain open.
2026-09-20 · [agent-decided · accepted] · Basic attack plus two active-skill slots; passive upgrades apply automatically and occupy no active slot · Owner accepted this simple control scheme using the inherited Alien Scrapyard UI layout. Exact abilities, switching rules and cooldowns remain open.
2026-09-20 · [agent-decided · accepted] · Initial active skills are Tracking, Powerful Strike and Healing, combinable across the two equipped slots · Owner accepted cooldowns without a mana bar. Healing affects self and nearby allies. Exact tuning and unlock costs remain open; the magic projectile is not in this initial set.
2026-09-20 · [agent-decided · accepted] · Initial passives: explorer gathering yield, warrior maximum health, mage healing effectiveness · Owner accepted all three. Learned passives apply automatically and occupy no active slot. Values, costs and prerequisites remain open; passive basic-attack damage is not in the initial set.
2026-09-20 · [agent-decided · accepted] · Improve the same six skills through three ranks across the initial/intermediate/advanced structure rather than adding control buttons · Owner accepted this progression. Basic attack plus two active slots remains. Rank effects, costs and requirements, including any village-level dependency, remain open.
2026-09-20 · [agent-decided · accepted] · Personal skills progress independently of village level · Owner accepted free investment across branches, sequential ranks 1/2/3 per skill and personal-level/available-point requirements. Exact costs and level thresholds remain undecided; no village-level gate applies.
2026-09-20 · Owner · The shop must sell useful items as well as cosmetics.
2026-09-20 · [agent-decided · accepted] · Initial useful shop catalogue: plant-based health potion, temporary gathering-yield tonic and temporary damage-reduction amulet, bought with personal crystals · Reuse Alien Scrapyard shop/inventory; permanent skills remain in the skill board. Crystal income, prices, activation controls, durations and stacking remain open.
2026-09-20 · [agent-decided · accepted] · Each newly completed personal milestone grants personal crystals automatically, without claiming · Gathering, combat and treasure milestones supply the shop currency. Exact crystal rewards and prices remain undecided.
2026-09-20 · [agent-decided · accepted] · Use shop items with one press/tap from the inventory · Potion heals immediately; tonic and amulet start temporary effects. Items occupy neither active-skill slot and add no HUD buttons; preserve the inherited inventory layout.
2026-09-20 · [agent-decided] · Working cooperative combat credit: damage or actual healing of a participant grants eligibility for personal objective progress; the village counts the defeated enemy once · User requested continuing; the exact proposal is retained as assistant-decided, with eligibility thresholds and expiry unresolved.
2026-09-20 · [agent-decided · accepted] · Owner confirmed the complete gameplay loop: freely explore, gather/fight/discover, help others, deliver all carried resources, develop the character and automatically grow the shared village · Read-back also included damage or healing as cooperative contribution. Exact timing, rewards, contribution thresholds and first-session details remain open.
2026-09-20 · [agent-decided · accepted] · First arrival at the village center with a gatherable resource and delivery point visible · One press gathers, one delivery shows the shared contribution, then free exploration. No mandatory tutorial or quest acceptance. Keep this opportunity available in advanced villages; timings are design targets, not measured evidence.
2026-09-20 · [agent-decided · accepted] · After the introductory delivery, show a resource path, a monster and a treasure clue from the center so players freely choose an activity · Owner accepted early freedom and an accessible first milestone intended to grant the first personal crystals soon. This is a design target; thresholds and elapsed time are not yet specified or tested.
2026-09-20 · [agent-decided · accepted] · Start with basic attack, gathering and one skill point for the first active skill · Owner accepted choosing Tracking, Powerful Strike or Healing before the first level-up; their rank-1 unlock costs one point. Later point rewards and other skill costs remain open.
2026-09-20 · [agent-decided · accepted] · Show the initial skill point with a discreet notice; never force the skill board open · The player may explore immediately and choose when to spend the point. Preserve Alien Scrapyard UI positions and dimensions.
2026-09-20 · [agent-decided · accepted] · Automatically preserve level, skills, crystals, items, counters and undelivered resources on leaving · Returning players appear in the village with progress intact and choose to continue or deliver. Reuse Alien Scrapyard persistence; exact save timing and temporary-effect behaviour across sessions remain open.
2026-09-20 · [agent-decided · accepted] · Players benefit on return from common village progress made while they were offline · Show a brief summary of new buildings and what remains for the next advance. Collaboration works across different play times; this does not add idle resource generation.
2026-09-20 · Owner · The common village has 13 levels and then restarts as a repeating loop. The assistant prepared village-cycle.md with provisional costs and proposed reset scope; these details await review.
2026-09-20 · [agent-decided · accepted] · Reset the village to level 1 after completing level 13, preserving all personal progress, carried resources, village surplus and completed-cycle history · Owner confirmed the proposed reset scope. Per-level quantities and detailed accounting remain provisional.
2026-09-20 · [agent-decided · accepted] · Repeat the same requirements every village cycle without automatically increasing costs or difficulty · Owner accepted stable cycles. Exact level quantities are still provisional and may be revised through design.
2026-09-20 · Owner · Give the character one badge for each village cycle they participated in · Personal cycle recognition persists across village resets. Participation threshold, award timing and display remain open. Endless personal milestones have not been accepted.
2026-09-20 · [agent-decided · accepted] · Award a cycle badge automatically on completion to contributors, even while offline · Qualifying actions: resource delivery, treasure contribution or help defeating monsters. Visiting alone does not qualify; one badge per completed cycle per eligible character.
2026-09-20 · [agent-decided · accepted] · Show cycle badges in the profile and the personal contributed-cycle count beside the character name · Recognition only, without combat advantages. Preserve inherited UI positions and dimensions.
2026-09-20 · [agent-decided · accepted] · Earn experience automatically through gathering, treasure discovery and combat participation · Experience advances character levels, level-ups award skill points, and milestones award personal crystals. Exact amounts and combat credit conditions remain open.
2026-09-20 · [agent-decided · accepted] · One skill point per personal level-up and one point per skill rank · Six skills with three ranks cost 18 points total; one starting point plus 17 level-ups fills the current board. XP curve, any additional level gates and progression after completing the board remain open.
2026-09-20 · Owner · Each skill rank costs twice the previous rank · With the established rank-1 cost of 1, costs become 1/2/4, paid per rank. Supersedes uniform one-point rank costs: 7 points per maxed skill, 42 for all six, supplied by the initial point plus 41 level-ups. Level-ups still award one point; additional personal-level gates remain undecided.
2026-09-20 · Owner · Replace resource-location abilities with movement specializations: flight, teleportation and speed · Wizard paths are offensive magic, healing and teammate support; warrior paths are damage, defence and ranged attacks.
2026-09-20 · Owner · A small floating robot accompanies the character and visually executes abilities · Ranged attacks fire from the robot; do not animate an avatar drawing a bow. Exact robot design remains open.
2026-09-20 · [agent-decided] · Revised names and ability effects proposed in class-paths-proposal.md · Old Tracking and six-skill board are superseded; 1/2/4 per-skill rank costs and the two-slot interface remain. Class-column/rank mapping, skill count and total board cost need definition.
2026-09-20 · Owner · Add an aura bar consumed when using abilities · Supersedes the previous no-mana/no-resource rule. Existing cooldowns remain unless revised. Aura capacity, regeneration, per-skill cost, insufficient-aura behaviour, basic-attack cost and exact UI placement remain open.
2026-09-20 · Owner · Separate equipment slots for active and passive abilities; each set expands to a maximum of five · Supersedes the fixed two-active-slot limit and unrestricted automatic passives. Starting counts, unlock schedule and UI expansion remain undecided.
2026-09-20 · Owner · Character attributes are Strength, Resistance and Intelligence · Effects, starting values and growth/allocation rules remain undecided. Aura regeneration and a free basic attack were previously proposed but have not been accepted.
2026-09-20 · [agent-decided · accepted] · Attribute roles: Strength boosts physical damage including robot physical shots; Resistance boosts maximum health and damage tolerance; Intelligence boosts magic, healing and maximum aura · Movement upgrades live in the skill board. Starting values, growth/allocation and exact formulas remain open.
2026-09-20 · Owner · Strength, Resistance and Intelligence grow automatically according to advancement through the skill board · Rejects the assistant proposal of manually allocated attribute points. Warrior emphasizes Strength; Mage emphasizes Intelligence. Exact trigger remains to be clarified.
2026-09-20 · Owner · Explorer gains +2 Strength, +2 Resistance and +2 Intelligence · Supersedes proposed Explorer +2/+3/+1. Warrior +3/+2/+1 and Mage +1/+2/+3 remain assistant-proposed exact distributions pending confirmation.
2026-09-20 · Owner · Learning a skill automatically adds attributes according to that skill type; learning a Mage skill follows the Mage rule · Award is tied to learning, not equipping. Mage +1 Strength/+2 Resistance/+3 Intelligence is accepted; Explorer remains +2/+2/+2. Warrior exact distribution remains proposed. Repeating the gain on later ranks has not been specified.
2026-09-21 · [agent-decided · accepted] · Intelligence affects magic/healing potency and aura capacity, not skill slots · Robot slot capacity progresses separately. Resistance gives maximum health and incoming-damage reduction; Strength gives physical damage. Active movement skills also use aura; native controls/paraglider remain freely available. Slot unlock schedule is still undecided.
2026-09-21 · [agent-decided · accepted] · Provisional slot schedule: personal levels 1/5/10/20/30 unlock 1/2/3/4/5 active and passive slots respectively · Automatic, no skill-point cost, independent of attributes and village level; slots persist through village resets.
2026-09-21 · [agent-decided · accepted] · Aura regenerates automatically, slowly during combat and faster outside it; basic attacks consume no aura · Exact rates, costs and combat-state timing remain to be defined.
2026-09-22 · [agent-decided · accepted] · Allow skill swapping at any time, including in combat; retain cooldowns while unequipped and never refill health/aura from passive swaps · Combat state affects aura regeneration only: attacking, taking damage or healing a combat participant enters/refreshes it; 8 seconds without these actions ends it (provisional). Show recovery state on the aura bar. Supersedes the unaccepted suggestion to allow swaps only outside combat.
2026-09-22 · [agent-decided · accepted] · Every learned skill rank grants its branch attribute increment, including upgrades to ranks 2 and 3 · Award once per new rank, not per point spent or equipment change. Costs remain 1/2/4; the attribute increment itself stays the same at each rank.
2026-09-22 · [agent-decided · accepted] · Each learned Warrior skill rank grants +3 Strength, +2 Resistance and +1 Intelligence · Completes the branch attribute table: Mage +1/+2/+3 and Explorer +2/+2/+2, applied once per newly learned rank.
2026-09-22 · [agent-decided · accepted] · Revised initial passives: Explorer movement speed, Warrior damage reduction, Mage aura regeneration · Effects apply only while equipped in passive slots. Replaces the old gathering-yield/maximum-health/healing passive roster; exact values and stacking remain open.
2026-09-22 · [agent-decided · accepted] · Provisional passive rank totals: Explorer speed +5/+10/+15%; Warrior damage reduction 5/10/15%; Mage aura regeneration +10/+20/+30% · Higher ranks replace lower effects, rather than summing their percentages. Other effect stacking remains open.
2026-09-22 · [agent-decided · accepted] · First Explorer active: temporary robot-assisted speed boost, consuming aura and using a cooldown · Flight and teleportation are later skills. Exact boost, duration, cost, cooldown and unlock conditions remain open; native paraglider stays freely available.
2026-09-22 · [agent-decided · accepted] · Provisional Impulso values: ranks 1/2/3 grant +20/+30/+40% movement speed for 4/5/6 seconds; all cost 15 aura with a 15-second cooldown · Rank bonuses are totals, not cumulative. Combination with passive speed remains open.
2026-09-22 · [agent-decided · accepted] · Pulso de impacto is the first Warrior active · Robot emits a short forward burst against nearby monsters, dealing physical damage improved by Strength. Exact area, range, rank values, aura cost and cooldown remain open.
2026-09-22 · [agent-decided · accepted] · Provisional Pulso de impacto ranks deal 150/200/250% of basic-attack damage per enemy, at 3 metres range, for 20 aura and an 8-second cooldown · Applies to monsters in the frontal area only. Exact angle/width and damage formula remain open.
2026-09-22 · [agent-decided · accepted] · First Mage active: Pulso curativo heals self and nearby allies; provisional base rank healing 15/22/30% of each recipient maximum health, radius 4 metres, cost 25 aura, cooldown 12 seconds · Intelligence improves efficacy, with formula pending.
2026-09-24 · [agent-decided · accepted] · Provisional base aura: 100 maximum, regenerating 2/second in combat and 5/second outside combat · Intelligence increases maximum aura, formula pending; equipped Mage passive improves regeneration. Basic attacks remain free.
2026-09-24 · [agent-decided · accepted] · Each gained Intelligence point adds 2 maximum aura, with initial maximum 100 · Formula uses Intelligence gained above the starting value, which remains undecided. Intelligence alone does not increase regeneration; magic/healing scaling remains open.
2026-09-24 · [agent-decided · accepted] · Provisional starting health 100; each gained Resistance point adds 5 maximum health · Formula: 100 + 5 × Resistance gained above its initial value. Starting Resistance and its damage-reduction formula remain undecided.
2026-09-24 · [agent-decided · accepted] · Basic physical damage is 10 plus 1 per gained Strength point · Impact Pulse uses that result as its damage basis. Starting Strength and enemy mitigation remain open.
2026-09-28 · [agent-decided · accepted] · Each gained Intelligence point adds 3% magic/healing efficacy linearly over the base effect · Formula: base effect × (1 + 0.03 × gained Intelligence). Supersedes the unaccepted 1% suggestion. Aura capacity remains +2 per gained Intelligence; regeneration is unchanged.
2026-09-28 · [agent-decided · accepted] · Resistance damage reduction uses Resistance gained / (100 + Resistance gained) · Approximately 9% at 10, 23% at 30 and 33% at 50; it never reaches immunity. Apply Resistance first, then the equipped Warrior passive to remaining damage. Starting Resistance remains open.
2026-09-28 · Owner · Characters start with Strength 1, Resistance 1 and Intelligence 1 · Derived formulas continue using points gained above the starting value, preserving base attack 10, health 100 and aura 100.
2026-09-28 · [agent-decided · accepted] · Insufficient aura cancels skill activation without aura spend or cooldown · Briefly flash the skill control and aura bar and show missing aura; movement and basic attacks continue.
2026-09-28 · [agent-decided · accepted] · Explorer speed passive and active Impulso stack additively · At rank 3, +15% and +40% produce +55% total during Impulso. Native paraglider behaviour is unchanged.
2026-09-28 · [agent-decided · accepted] · Defensive order: Resistance, equipped Warrior passive, protective amulet; each reduces remaining damage · Percentages are not added, immunity is impossible, and rounding occurs only after all reductions. Exact rounding direction remains open.
2026-09-28 · [agent-decided · accepted] · Second Explorer active: Ascenso gives a robot-assisted vertical boost and brief controlled aerial movement, then native paragliding continues · Cost 25 aura and cooldown 20 seconds at every rank. Height and duration by rank remain open.
2026-09-28 · [agent-decided · accepted] · Ascenso ranks 1/2/3: vertical boost 3/5/7 metres and controlled aerial movement 1.5/2/2.5 seconds · Values are rank totals. Aura cost remains 25 and cooldown 20 seconds.
2026-09-28 · [agent-decided · accepted] · Third Explorer active: Salto de fase teleports through the robot only to predefined points already visited by the character · No arbitrary coordinates. Cost 35 aura, cooldown 30 seconds; rank distance/capacity and point placement remain open.
2026-09-28 · [agent-decided · accepted] · Salto de fase progression: rank 1 visited points on current island; rank 2 adds directly connected islands; rank 3 any visited eligible world point · Level design defines connectivity and eligible points. Cost remains 35 aura, cooldown 30 seconds.
2026-09-28 · [agent-decided · accepted] · Second Warrior active: Escudo cinético creates a temporary personal robot barrier · It reduces remaining damage after Resistance, equipped Warrior passive and protective amulet. Cost, cooldown, duration and rank values remain open; it does not protect allies.
2026-09-28 · [agent-decided · accepted] · Escudo cinético ranks reduce remaining damage by 20/30/40% for 4/5/6 seconds · Cost 25 aura and cooldown 18 seconds at every rank. Values replace one another.
2026-09-28 · [agent-decided · accepted] · Third Warrior active: Disparo de precisión is a single-target ranged physical shot fired by the robot · No bow gesture. Uses Strength-scaled basic damage before its rank multiplier. Values and targeting remain open; wildlife/allies are invalid targets.

2026-09-29 · [agent-decided · accepted] · Provisional Disparo de precisión ranks deal 200/275/350% of Strength-scaled basic-attack damage at 12/15/18 metres · Cost 25 aura and cooldown 10 seconds at every rank. Rank values replace one another; peaceful wildlife and allies remain invalid targets. Exact targeting assistance remains open.

2026-09-29 · [agent-decided · accepted] · Descarga arcana is the second Mage active skill · The robot fires a single-target magic projectile scaled by Intelligence; higher ranks add a small impact explosion against nearby hostile monsters. Exact numerical values remain open.

2026-09-29 · [agent-decided · accepted] · Provisional Descarga arcana ranks: 30 direct damage; 45 direct plus 20 area damage within 2 metres; 60 direct plus 35 area damage within 3 metres · Intelligence scales direct and area damage. All ranks have 15-metre range, cost 25 aura and use an 8-second cooldown.

2026-09-29 · [agent-decided · accepted] · Campo de enlace is the third Mage active skill · The robot projects a temporary aura around its user; the user and nearby players deal more damage while inside it. Formal party membership is not required. Exact numerical values and stacking remain open.

2026-09-29 · [agent-decided · accepted] · Provisional Campo de enlace ranks grant +10/+15/+20% physical and magic damage in a 4/5/6-metre radius for 5/6/7 seconds · Every rank costs 30 aura and has a 20-second cooldown. Overlapping fields apply only the strongest bonus; Intelligence does not increase it.

2026-09-29 · [agent-decided · accepted] · Initial skill-board scope is 12 skills: three active and one passive for each of Explorer, Mage and Warrior · Players may freely learn and combine families. Five active and five passive slots remain the long-term capacity; further skills are future expansion.

2026-09-29 · [agent-decided · accepted] · All 12 initial skills are visible and rank 1 of any skill can be learned immediately with an available point · Ranks are sequential within each skill and cost 1, then 2 additional, then 4 additional points. Families have no prerequisites or lockouts; spending and equipment choices create specialization.

2026-09-29 · [agent-decided · accepted] · Free full skill-board reset is available only at the village centre while outside combat · Refund all spent points and recalculate skill-derived attributes. Preserve personal level, experience and unlocked slot capacity; resetting is unavailable on islands or during combat.

2026-09-29 · [agent-decided · accepted] · Personal experience is awarded when an activity is performed, independently of village delivery · Collection pays XP immediately; qualifying combat participation pays on enemy defeat; treasure pays on opening. Delivery advances the village without paying the same XP again. Persistent counters track the three activity families separately.

2026-09-29 · [agent-decided · accepted] · Show personal level and a progress bar without numeric XP · Exact lifetime activity totals remain visible in the profile. Eligible actions visibly advance the bar, and level-up clearly announces the common skill point earned.

2026-09-29 · Owner · Initial maximum personal level is 99 · Characters start at level 1 with one skill point and gain one per level. The 12 launch skills cost 84 points in total, so treatment of the remaining 15 points is still open.

2026-09-29 · Owner · Skill points beyond the 84-point launch board remain accumulated for future board extensions · Show them as unspent points; do not convert or discard them. They persist through village cycles and board resets.

2026-09-29 · [agent-decided · accepted] · Provisional hidden personal XP: resource unit 1; normal/elite/guardian-or-boss enemy 10/25/60; common/rare/ancient treasure 15/40/100 · Every qualifying combat participant receives the full award without splitting it among players. UI continues showing only level and bar progress.

2026-09-29 · [agent-decided · accepted] · Provisional level-up requirement is 100 + 20 × (current level − 1) hidden XP · Reaching level 99 from level 1 requires 104,860 XP total. The player sees only the personal level and progress bar.

2026-09-29 · [agent-decided · accepted] · Bonus resource yield counts toward personal XP, lifetime collection counters and carried inventory · Use the actual units received after bonuses; later delivery still grants no duplicate personal XP.

2026-09-29 · [agent-decided · accepted] · Close the initial-phase catalogue: central village and connected forest island; wood, stone and fruit; peaceful birds and deer; normal Root Prowler enemy; common lost-supply chest; central gathering place, storehouse and communal shelter · Gameplay roles are fixed for launch scope; names may change with later visual identity.

2026-09-29 · [agent-decided · accepted] · Close the intermediate-phase catalogue: rocky cave island; iron and medicinal plants; elite Stoneback; cooperative but solo-completable Cave Warden; rare ancient chest; infirmary and reward-free training ground · Initial content remains available and necessary. Gameplay roles are fixed for launch scope; names may change later.

2026-09-29 · [agent-decided · accepted] · Close the advanced-phase catalogue: ancient-ruins island; ancestral ore; magic-resistant Ruin Sentinel; repeatable cooperative but solo-completable Colossal Guardian; ancient relic chest; observatory and communal monument · Observatory indicates islands with active guardians or special treasures, not resource nodes. Monument shows cycle and badge history. Earlier content remains necessary.

2026-09-29 · [agent-decided · accepted] · Map village levels 1–4 to the initial phase, 5–8 to intermediate and 9–13 to advanced · Bands express difficulty and settlement growth without locking islands. All islands are explorable from the start; buildings and services appear automatically at their assigned village levels.

2026-09-29 · [agent-decided · accepted] · Fix the 13-level village-state sequence: base camp; storehouse; shelter; forest expansion; infirmary; training ground; storehouse/shelter expansion; established village; observatory; monument; monument/village expansion; final appearance; cycle celebration and reset · Numerical completion requirements remain separately tunable.

2026-09-29 · [agent-decided · accepted] · Every required village category must reach its own target; categories cannot substitute for one another · Each category contributes an equal capped share of the common bar and shows its remaining quantity. Consume requirements on completion, preserve resource/wealth surplus, and require fresh enemy defeats at each level.

2026-09-29 · [agent-decided · accepted] · Shared wealth values: lost supply chest 1, ancient chest 3, relic chest 6 · Show wealth as a visible village-resource quantity with its own icon, not as points; keep it separate from personal crystals. Each chest adds one to the discoverer's personal treasure counter.

2026-09-29 · [agent-decided · accepted] · Accept the complete 13-level village-requirement table as the provisional launch-balance baseline · Repeat the same requirements each cycle. Values remain an untested balance hypothesis and do not claim a completion time.

2026-09-29 · [agent-decided · accepted] · Every resource node yields five base units with one press/tap · Rarity comes from availability and replenishment rather than different yields. Apply bonuses after the base five and count all received units for inventory, personal counters and XP.

2026-09-29 · [agent-decided · accepted] · Provisional shared-node respawn: wood/stone/fruit 30 seconds; iron/plants 60; ancestral ore 120 · A collected node depletes for everyone and displays a visual recovery state without a numeric timer.

2026-09-29 · Owner correction / accepted timing · Multiple shared chests of each available tier are active simultaneously; never only one chest for all players · Each common/rare/ancient chest independently respawns after 2/5/10 minutes at one of several predefined island positions. Observatory shows the island, not exact location. Counts remain open.

2026-09-29 · [agent-decided · accepted] · Provisional simultaneous treasure counts: forest 6 common chests/12 positions; caves 4 rare/8; ruins 3 ancient/6 · Each chest respawns independently into a free eligible point; two chests never share one position.

2026-09-29 · [agent-decided · accepted] · Provisional shared enemy population: 8 Root Prowlers/30s; 5 Stonebacks/60s; 2 Cave Wardens/3m; 5 Ruin Sentinels/90s; 1 Colossal Guardian/5m · Respawn within eligible zone points. Enemies remain available in every village phase; the unique boss is the main community encounter.

2026-09-29 · [agent-decided · accepted] · Common enemy behaviour: proximity detection and pursuit, readable attack telegraphs, target switching, full reset after 8 seconds with no participant in the encounter zone · Defeats grant XP/shared progress but no meat or resources. Guardians and bosses add area attacks.

2026-09-29 · [agent-decided · accepted] · Provisional enemy stats: Root Prowler 60 HP/8 damage; Stoneback 180/14 and 25% physical resistance; Cave Warden 500/18; Ruin Sentinel 240/16 and 25% magic resistance; Colossal Guardian 2,500/25 · Health never scales with player count. Values remain an untested balance hypothesis.

2026-09-29 · [agent-decided · accepted] · Robot basic attack is a one-press physical projectile at 6 metres with a 1-second minimum interval, no aura cost and no automatic repetition · Uses 10 + gained Strength. Light assistance targets the hostile nearest screen centre in range; fauna and players are invalid.

2026-09-29 · [agent-decided · accepted] · Regenerate 2% maximum health per second outside combat; damage or combat stops regeneration · Infirmary heals fully and freely; plant potion works during combat; defeat returns the player to the village at full health while preserving progress, resources and items.

2026-09-29 · [agent-decided · accepted] · Provisional useful items: potion restores 50% max health; tonic adds 2 units per node for 10 minutes; amulet reduces remaining damage by 20% for 10 minutes after Resistance/passive and before Kinetic Shield · One tonic and amulet effect at a time; another copy refreshes rather than stacks. Potions can be repeatedly consumed from inventory.

2026-09-29 · [agent-decided · accepted] · Provisional crystal economy: 5 crystals for each additional 100 gathered resource units, 10 qualifying enemy defeats or 5 treasures; repeat automatically at every lifetime-counter multiple · Prices: potion 5, tonic 10, amulet 10. Every core activity can fund the useful shop.

2026-09-29 · [agent-decided · accepted] · Inventory: unlimited carried resources; deliver every category in one action; preserve resources through defeat, logout and village reset; cap each consumable type at 99 · Shop blocks capped purchases without charging. Treasure goes directly to village wealth and occupies no inventory.

2026-09-29 · [agent-decided · accepted] · Combat credit requires actual damage or actual healing and remains valid for 20 seconds after the last useful contribution; no minimum damage share · Credit survives falling or moving away within the window. Overhealing and tags older than 20 seconds do not qualify. Village counts the defeat once.

2026-09-29 · [agent-decided · accepted] · Campo de enlace grants its caster combat credit when an ally inside deals at least 1 actual bonus damage; each qualifying hit refreshes the 20-second window · Reward is still once per enemy; an unused field gives no credit.

2026-09-29 · Owner · Chest contents vary between shared village wealth and personal inventory items · Finder alone receives discovery XP/counter credit; nearby players receive no personal discovery credit. Supersedes fixed wealth for every chest and fixed wealth by tier. Item table, probabilities and tier weights remain open.

2026-09-29 · Owner-approved direction · Every chest gives shared village supplies; some also give the finder personal equipment based on rarity · Equipment persists and improves the character when equipped. Opener alone receives discovery credit. Contents, rates, slots and duplicate handling remain open.

2026-09-29 · Owner-approved · Three equipment slots: Robot Core (active abilities), Defensive Module (survivability), Amulet (movement or gathering) · One item per slot, no stacking duplicates. Common chests supply-only; rare can grant basic equipment; ancient can grant stronger equipment. Exact stats and drop chances remain open.

2026-09-29 · [agent-decided · accepted] · Provisional equipment effects: Robot Core +10% active damage or −10% aura cost; Defensive Module +5% max health or +5% damage resistance; Amulet +5% movement speed or +1 resource per node · One effect per item; duplicates do not stack. Higher ancient-tier values and interaction stacking remain open.

2026-09-30 · [agent-decided · accepted] · Equipment quality tiers are Rare/Epic/Legendary at ×1/×2/×3 base effect · Higher chest rarity improves higher-tier chances; all tiers use the same slot, one item equipped per slot, Legendary is the cap. Drop rates remain open.

2026-09-30 · [agent-decided · accepted] · Keep unequipped gear when replacing it; compare and equip from anywhere outside combat · No selling or dismantling in the initial design. Preserve inventory/item compatibility with a possible future shop trading any inventory objects; trading rules remain open.

2026-09-30 · [agent-decided · accepted] · Equipment inventory capacity: 20 pieces · If full, reserve a gear drop privately for its finder at the source chest while awarding supplies/discovery and letting the public chest respawn as normal. Finder can reclaim after making room; pending items persist through logout and village reset. Future inventory trading remains compatible but undesigned.

2026-09-30 · [agent-decided · accepted] · Provisional chest drops: common supplies only; rare always supplies plus 25% Rare gear chance; ancient always supplies plus 70% gear chance, with dropped gear 60% Rare/30% Epic/10% Legendary · Probabilities remain balance assumptions.

2026-09-30 · Owner clarification · Chest supplies are a carried Supply Bundle delivered at the village centre before they count toward shared needs; equipment goes directly into the finder's personal inventory · Supersedes direct village credit for supply loot.

2026-09-30 · Documentation consistency update · Replaced superseded instant treasure-wealth credit with carried Supply Bundles delivered at the village · Supply is a separate village requirement category; personal equipment goes directly to finder inventory.

2026-09-30 · [agent-decided · accepted] · Chest supplies: common 1 unit, rare 3, ancient 6 · Finder carries bundle units as resources and delivers them at the village with all other resources. Only delivery advances the shared Supplies requirement; surplus persists.

2026-09-30 · [agent-decided · accepted] · Same-type equipment, skill and item bonuses add together; e.g. Epic Core +20% and Link Field +20% = +40% active damage inside the field · Damage reductions remain sequential; Defensive Module goes after Warrior passive and before protective amulet. No direct additive mitigation or immunity.

2026-09-30 · [agent-decided · accepted] · Put equipment slots and the 20-piece storage in a section/tab of the existing inventory window · Preserve established UI positions/dimensions; comparison appears on item selection; add no main-HUD controls.

2026-09-30 · [agent-decided · accepted] · Gear drops roll uniformly across six variants: active damage Core, aura-cost Core, max-health Module, damage-reduction Module, movement Amulet or resource-yield Amulet · No family restrictions. Chest tier sets quality; duplicates stay in inventory.

2026-09-30 · [agent-decided · accepted] · Equipment by Rare/Epic/Legendary: core damage +10/20/30%, core aura cost −10/20/30%; module max health +5/10/15%, damage reduction +5/10/15%; amulet speed +5/10/15%, yield +1/+2/+3 per node · Cost reduction never makes a skill free; round aura cost up. Yield bonus adds with other yield sources.

2026-09-30 · Owner correction · Chest equipment is shared loot, never privately reserved · If the opener has no slot, the item stays in the chest. Any player may claim it by opening the chest; it then vanishes for everyone and the original finder loses the opportunity. Warn the opener about this risk.

2026-09-30 · Owner revision · On a gear drop, chest opener chooses keep in free slot, replace same-slot piece (discard old) or reject (forfeit new) · Chest then disappears for everyone and starts respawn. No second player can claim leftover gear; supplies and discovery credit go to opener only. Supersedes shared leftover-loot rule.

2026-09-30 · Owner-approved · When replacing gear, return the old item to storage if a slot is free · If full, warn that replacement permanently discards it; player confirms or rejects the new item.

2026-09-30 · [agent-decided · accepted] · Gear reward comparison appears inside the existing inventory window without moving/resizing it · Show new/current same-slot item, quality and effect. Keep/Replace/Reject; full inventory requires confirmation naming discarded item. Chest disappears after choice; no new main-HUD controls.

2026-09-30 · [agent-decided · accepted] · Supply-only chest gives a brief existing-UI notice with units received and delivery reminder; when gear drops, show supplies in the comparison panel · Opener alone gains treasure counter and hidden XP progress. Chest vanishes after content is resolved.

2026-09-30 · [agent-decided · accepted] · Provisional active resource nodes: forest 8 wood/6 stone/6 fruit; caves 6 iron/5 medicinal plants; ruins 4 ancestral ore · Shared per-island counts; positions remain level-design work; untested density baseline.

2026-09-30 · [agent-decided · accepted] · Resources are recognized in-world with no detector/map marker; reuse inherited interaction range/prompt placement · Depleted nodes show a recovery visual without timer; preserve HUD layout.

2026-09-30 · [agent-decided · accepted] · Resource gathering range is 8 metres, reusing the inherited world-object click pattern · One press/tap gathers once; preserve contextual prompt placement.

2026-09-30 · [agent-decided · accepted] · Treasure chest interaction range is 8 metres, matching resource gathering · One press/tap opens; no holding; preserve prompt placement.

2026-09-30 · [agent-decided · accepted] · Hostile detection radius 10m, pursuit boundary 20m from home, full reset after 8s with no participant inside · Attacking/healing can establish combat from longer range.

2026-09-30 · [agent-decided · accepted] · Enemy telegraph durations: standard attack 0.9s, elite/guardian area 1.2s, Colossal Guardian area 1.5s with ground marker · All attacks dodgeable by normal movement; no new dodge control or HUD button.

2026-09-30 · [agent-decided · accepted] · Attack patterns: Root Prowler swipe; Stoneback frontal charge; Cave Warden frontal strike/circular pulse; Ruin Sentinel ranged magic projectile; Colossal Guardian circular stomp/frontal sweep · Use established damage/telegraph values; no status effects.

2026-09-30 · [agent-decided · accepted] · Attack cadence: Root Prowler 3.5s; Stoneback/Ruin Sentinel 4.5s; Cave Warden 5.5s alternating attacks; Colossal Guardian 6s alternating attacks · Includes warning; no overlap. Values provisional.

2026-09-30 · [agent-decided · accepted] · Enemy attacks lock target and impact point when telegraph begins · Single-target warnings mark the chosen player; area warnings mark a fixed ground zone. Markers do not track movement, allowing a clear dodge.

2026-09-30 · [agent-decided · accepted] · Single-target attacks rotate among recent eligible participants using the 20-second contribution window; solo player is the only target · No threat/taunt system. Colossal Guardian follows same rule.

2026-10-01 · [agent-decided · accepted] · Shared enemy health bars appear when combat starts; all players see the same health, without numbers · Colossal Guardian has a more prominent bar throughout its active encounter; bars refill on reset.

2026-10-01 · [agent-decided · accepted] · Enemy hits trigger a brief impact flash and visible health-bar drop; no floating damage numbers · Bar and impact provide feedback without clutter.

2026-10-01 · [agent-decided · accepted; clarified 2026-10-03] · Player level progress, health and aura share the existing lower HUD panel · On the 1920×1080 reference canvas preserve desktop position bottom 18/left 460 with size 1000×58, and compact mobile position bottom 14/left 304 with size 1312×78. Reorganize contents inside the panel only; do not add a HUD region or control. Health and aura use labeled/icon bars without numeric values; insufficient-aura feedback still shows the missing amount.

2026-10-01 · [agent-decided · accepted] · When player health drops below 25%, briefly flash the health bar · Critical-health cue stays in the existing lower HUD; no additional panel or control.

2026-10-02 · Owner · Enemy defeats award fixed personal XP to each qualifying contributor, plus a collaboration bonus when at least two players contribute · Accepted base awards remain 10/25/60 XP for normal/elite/guardian-or-boss enemies; base XP is not split. [agent-decided · accepted] Each qualifying participant receives an additional 25% of the enemy's base XP when two or more distinct players qualify under the existing damage/useful-healing/Link Field contribution rule. The bonus is per player and does not increase with group size. Fractional XP is retained internally (e.g. 2.5 for a normal enemy); the UI continues to show only the progress bar. Values remain provisional balance assumptions.

2026-10-02 · [agent-decided · accepted] · From village level 1, the central hub supports resource delivery and access to the shop and skill board · New village buildings add their defined services automatically as the shared village grows.

2026-10-02 · [agent-decided · accepted] · Open village services by interacting with their physical building or station and reuse the existing UI windows · Preserve inherited UI positions and dimensions; add no new main-HUD controls.

2026-10-02 · Owner · Observatory service manages Phase Jump destinations already visited by the player · [agent-decided · accepted] Show a selectable list of known eligible points filtered by the player's Phase Jump rank; visiting the observatory does not unlock points or bypass aura cost/cooldown. Retain the previously accepted island-level alert for active guardians or special treasures; show no exact resource or treasure locations.

2026-10-03 · [agent-decided · accepted] · The common storehouse lets players inspect shared resource/supply reserves and remaining needs for the current village level · Read-only overview; resource delivery remains at the central point. Opens from the physical storehouse using an inherited UI window and geometry.

2026-10-03 · [agent-decided · accepted] · After applying all defensive reductions, round final damage to the nearest whole point, with a minimum of 1 for any attack that hits · Mitigation remains sequential and can never make the hit immune.

2026-10-03 · Owner · The communal shelter provides a gameplay service · [agent-decided · accepted] Interacting with its rest point outside combat restores the player's aura to maximum. The level-5 infirmary remains the distinct free full-health service. No new HUD control is added.

2026-10-03 · [agent-decided · accepted] · The training ground has indestructible practice targets for basic attacks and active skills · Targets never attack players, award no XP/items/crystals, advance no counters or village needs, and do not count as enemy defeats. Skills consume aura and use their normal cooldowns.

2026-10-03 · [agent-decided · accepted] · On shared village-level completion, all players receive a brief notice through the inherited feedback panel and see the new building or visual state appear · Keep the established UI geometry and add no new HUD control.

2026-10-03 · [agent-decided · accepted] · Apply each village upgrade for all players immediately after its completion notice, with a brief appearance animation and no construction timer · Progress never waits on a separate build action.

2026-10-03 · [agent-decided · accepted] · A village-level advance grants its shared building/service or visual upgrade, with no additional personal XP or crystals · Individual activity rewards are granted when collecting, defeating enemies or opening treasure; avoid a second payout for the same contribution.

2026-10-03 · Owner-approved direction · The village's central landmark is a large bioluminescent tree, with communal buildings arranged around it and growing through the 13-level cycle · Working visual direction only; final name and logo remain open.

2026-10-03 · [agent-decided · accepted] · When the enemy-defeat collaboration bonus triggers, show “Bonus de colaboración” briefly in the inherited feedback panel · Do not reveal numeric XP; preserve the existing UI geometry.

2026-10-03 · [agent-decided · accepted] · On each personal crystal milestone, grant the 5 crystals automatically, update the balance, and briefly show “+5 cristales” in the inherited feedback panel · No claim step or new HUD control. Collection milestones aggregate units across resource types; the lifetime counters still track each resource separately. Defeat milestones aggregate eligible enemy types; treasure milestones aggregate chest tiers.

2026-10-03 · [agent-decided · accepted] · Village building/station interactions use 8m range; the shop uses 12m, preserving Alien Scrapyard's corresponding interaction distances · One press/tap opens the service; no new HUD controls.

2026-10-03 · [agent-decided · accepted] · The existing character profile shows progress remaining to the next 5-crystal milestone for resource collection, enemy defeats and treasure openings · Use cumulative activity counters; resource progress aggregates all material types. Keep these details out of the main HUD.

2026-10-03 · [agent-decided · accepted] · Keep five active and five passive slot positions fixed in the skill UI · Slots that are not yet unlocked appear dimmed; unlocking capacity does not move existing controls.

2026-10-03 · [agent-decided · accepted] · A newly unlocked active or passive slot starts empty and the player equips a learned skill manually · Slot unlocks cost no skill points and never auto-equip a skill.

2026-10-03 · [agent-decided · accepted] · When personal-level progression unlocks additional active/passive capacity, briefly notify the player through the inherited feedback panel · Do not open the skill board automatically.

2026-10-03 · Owner · Remove separate promotion titles such as Fighter → Berserker from the launch progression · Character development uses the three mixable Explorer/Mage/Warrior branches and the 1–3 ranks of each learned skill; no extra class-title ladder or promotion requirements.

2026-10-03 · [agent-decided · accepted] · Balance guardian/boss encounters for a typical group of up to four participants · No hard join cap; additional players may help, while enemy stats remain fixed regardless of group size. Solo completion remains a design baseline; numerical balance requires future validation.
2026-10-03 · [agent-decided · accepted] · Direct physical connection graph: Forest ↔ Caves ↔ Ruins, without a direct Forest–Ruins connection · Authored jump-and-glide routes connect the islands; mandatory bridges are not required. Every island is explorable from the beginning and native paraglider remains available; graph states direct authored links, not a forced route. Geometry and glide distances remain level-design work.
2026-10-03 · [agent-decided · accepted] · Make authored island routes visually recognizable from the village and nearby islands · Use world scenery/readable landmarks rather than interface markers, preserving the inherited UI layout.
2026-10-03 · [agent-decided · accepted] · Make cooperative combat legible to nearby bystanders through in-world enemy telegraphs and visible companion-robot support effects · Do not add interface markers or panels.
2026-10-03 · [agent-decided · accepted] · Make the village level-up the main shareable social moment · All players receive the inherited-UI notice and see the new building or visual transformation appear together; it celebrates shared progress without duplicating personal action rewards.
2026-10-03 · [agent-decided · accepted] · Show recent contributors by name in the existing common-progress window · Briefly recognize help without a leaderboard or new UI geometry.
2026-10-04 · [agent-decided · accepted] · Friends join through open world play, without party or invitation flow · Personal progression and the existing collaboration bonus depend on qualifying actions; inviting alone grants no reward.
2026-10-04 · Owner · Return motivation combines persistent shared village progress and personal RPG progression · Future expansions are intended to add items and skills to extend both tracks; expansion content and cadence remain undecided. Next-day retention remains untested.
2026-10-04 · Owner revision · Character profiles are private; other players cannot inspect skills, equipment or counters · The earlier public cycle-count-by-name proposal is superseded. Other players see only level and health overhead indicators during combat; personal cycle badges stay in the owner's profile.
2026-10-04 · [agent-decided · accepted] · Pandora's two-sentence premise: a community grows around a great bioluminescent tree among floating islands; players gather, help each other in combat and find supplies to grow the village while developing personal skills · Uses the already-defined actions and setting without adding a new narrative system.
2026-10-04 · [agent-decided · accepted] · The great bioluminescent tree is Pandora's visual signature and wayfinding anchor · Keep it prominent and recognizable from nearby islands wherever the authored line of sight allows; do not add interface markers or require visibility from every location.
2026-10-04 · Owner · Pandora's civilization blends ancestral science, nature, alchemy and magic through crystal technology, runes and grimoires · Explorer uses green, Warrior red, Mage blue and neutral village functions yellow; these colors tint the village. Grimoire implementation and crystal gameplay role remain to be clarified.
2026-10-04 · Owner · Town coins replace crystals as personal shop currency · Coins are server-side story currency earned from chests, missions/objectives, selling items and defeating enemies; no blockchain token or functionality. Physical crystals are objects reserved for a future expansion.
2026-10-04 · Owner · Launch personal equipment consists of runes · Three universal equipped slots; unlimited rune storage; duplicates stay separate. Runes may raise Strength, Resilience and/or Intelligence and grant at most one existing launch ability. Board abilities are permanent; rune abilities require the rune to be equipped and use existing active/passive slots, aura and cooldowns. New rune abilities may arrive in expansions.
2026-10-04 · Owner · Launch chest rewards are Supply Bundles, town coins and/or runes/equipment · No crystals or consumables in chests. Runes can be found in chests or bought from a basic shop selection; attribute-only runes are sold by the launch shop, ability-granting runes come from chests. Found runes may be sold; purchased items cannot be resold. Replacing an equipped rune returns it to personal storage.
2026-10-04 · Owner · Launch shop sells attribute runes and one health plus one aura consumable · Both consumables are usable in combat and consumed on use. Exact effects, prices, cooldown and HUD slot mapping remain unresolved.
2026-10-04 · Owner clarification · Town coins are server-side storytelling currency; physical crystals are reserved for an expansion · Economy/rune rules are consolidated in `economy-and-items.md`; proposed payouts and prices in `proposal-defaults.md` remain unapproved defaults.
2026-10-04 · Owner · Enemy coin payouts: normal 2, elite 5, guardian/boss 15 coins per qualifying player · When at least two players qualify, each receives a 25% bonus on their own payout; rewards are not split from a shared pool.
2026-10-04 · [agent-decided · accepted] · Player promise: explore floating islands, gather resources, fight monsters and find treasure together to grow a shared village while building a personal RPG hero.
2026-10-04 · [agent-decided · accepted] · Primary player: a Decentraland visitor who enjoys light RPG progression and cooperative exploration, wants a useful short session, and can progress alone or join nearby players without forming a party.
2026-10-04 · [agent-decided · accepted] · Comparables: Palia for welcoming shared-world gathering and solo-or-friends play; Dauntless for cooperative monster hunts and equipment progression · Pandora differentiates through its automatically evolving common village, floating-island exploration and shared resource-delivery loop.
2026-10-04 · Owner · Keep Pandora as the working title; postpone the public title and logo decision.
2026-10-04 · [agent-decided · accepted] · Motivation: build on lessons from Alien Scrapyard to create a more collaborative Decentraland world where each player's actions grow a shared village while their character develops.
2026-10-04 · Owner · Approve all proposed numerical launch economy defaults in `proposal-defaults.md` · This includes starting balance 0; guaranteed common/rare/ancient chest coins 5/15/30; objective milestones 10 coins at 100 gathered units, 10 eligible defeats and 5 opened chests; rune sale values 5/10/20/40 by quality; attribute runes +1 for 25 coins; health/aura supplies restore 50% for 10 coins; and the 5-second shared consumable cooldown. These are initial untested balance values.

2026-10-04 · [agent-decided · accepted] · Initial ability-rune trio: Strength → Precision Shot; Resilience → Boost; Intelligence → Healing Pulse · These reuse existing abilities and remain available only while the corresponding rune is equipped.

2026-10-04 · Owner · Each initial ability rune grants +1 to its matching attribute in addition to its ability · Strength/Precision Shot, Resilience/Boost, Intelligence/Healing Pulse. This is an initial untested balance value; basic shop runes remain attribute-only.

2026-10-04 · [agent-decided · accepted] · Ability-granting runes drop only from Rare or Ancient chests, following the existing provisional chest rarity odds · Common chests never drop runes; basic attribute runes remain available from the shop. This keeps the shop predictable and makes ability runes treasure discoveries.

2026-10-04 · [agent-decided] · When a chest grants a rune, offer Equip/Store, Exchange with an equipped rune, or Sell · Any displaced rune returns to unlimited personal storage. The chest disappears after the finder resolves the choice.

2026-10-04 · [agent-decided] · Use existing Alien Scrapyard quick-use HUD slots for health and aura supplies · Preserve their positions and dimensions; both share the approved 5-second item-use cooldown.

2026-10-04 · Owner · Players who participate in completing a 13-level village cycle receive major rewards · Reward contents and the qualifying participation threshold remain open.

2026-10-04 · [agent-decided · accepted] · Cycle reward eligibility requires at least one qualifying contribution during that cycle: deliver resources or supplies, or help defeat an enemy under the existing combat participation rules · Visiting alone does not qualify. Every eligible player receives the same guaranteed reward, with no contribution ranking or volume scaling.

2026-10-04 · Owner · Cycle completion reward is 100 town coins plus a cycle-exclusive badge for each eligible participant · All eligible participants receive the same reward. This is an approved initial balance value, not playtested.

2026-10-04 · Owner · Deliver cycle completion rewards automatically at the eligible player's next login if they were offline when the cycle completed · Being online at completion is not required.

2026-10-04 · [agent-decided · accepted] · Target roughly two weeks for one village cycle in a small community of regular contributors · This is a pacing target only, with no hard deadline and no claim of tested completion time.

2026-10-04 · Owner · Cycle completion reward: 100 town coins and an exclusive badge for each eligible contributor; eligible offline players receive it at next login · Equal reward for all eligible contributors; amount approved as initial untested balance.

2026-10-04 · [agent-decided · accepted] · Balance village requirements around approximately four regular contributors · Planning baseline only, with no cap or entry requirement; numerical targets remain adjustable and untested.

2026-10-04 · Owner · Players may join a village cycle at any time, contribute immediately and qualify for the same cycle reward under the usual participation rule · No entry lock or waiting period.

2026-10-04 · [agent-decided · accepted] · A player who joins mid-cycle sees and contributes to the current shared village state immediately · The same cycle-reward eligibility rule applies regardless of join date.

2026-10-04 · Owner · Initial launch includes Forest, Caves and Ruins · All three islands are explorable from the beginning; content and enemy difficulty follow the initial, intermediate and advanced village phases.

2026-10-04 · Owner-approved scope · Include all three islands in the initial launch, with access from the start and progression-phase content/difficulty · This establishes the world scope; delivery staffing and schedule remain open.

2026-10-04 · Owner instruction · Codex should decide routine remaining design and balance details using its judgment, label proposals clearly and leave them for owner review during development · No gameplay tests are to be run during this document-design phase.
