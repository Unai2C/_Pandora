# Pandora — Character branches and skill-board scope

## Owner-confirmed direction

Explorer development concerns movement: flight, teleportation and speed. Remove resource/treasure detection and tracking abilities; discovering things remains exploration by the player. Wizard paths cover offensive magic, healing magic and helping teammates. Warrior paths cover damage, defence and ranged attacks.

A small floating robot accompanies the character and executes the abilities visually. Ranged attacks fire from the robot, without a bow gesture or bow animation from the avatar. Gameplay progression belongs to the character; the robot is the visual source of abilities. Exact robot appearance and animation remain undecided.

These directions supersede the previous Hunter/Tracker/Tamer and pet/summoning proposal. Prior class names are not locked.

## Confirmed launch branches and skill roster

The older separate specialization/mastery ladder (for example, “Fighter → Berserker”) is retired. The player develops the three mixable branches by learning and ranking individual skills; there is no extra class title or promotion system.

| Branch | Three active skills | Passive skill |
|---|---|---|
| Explorer | Boost; Ascension; Phase Jump | Movement speed |
| Mage | Arcane Bolt; Healing Pulse; Link Field | Aura regeneration |
| Warrior | Impact Pulse; Kinetic Shield; Precision Shot | Damage reduction |

Exact skill behavior, ranks, aura costs and cooldowns are recorded in the main GDD. The companion robot visually executes abilities; the character's chosen skills and ranks determine progression.

## Initial board scope — accepted

[agent-decided · accepted] The initial skill board contains exactly 12 skills: three active skills and one passive skill for each of the Explorer, Mage and Warrior families. Players may learn and equip skills from different families in the same build; choosing a family does not lock the others. The maximum five active and five passive slots support mixed builds, although the initial board offers only three passive skills. Additional skills belong to future expansion rather than initial scope.

[agent-decided · accepted] All 12 initial skills are visible from the beginning. A player with an available common skill point may learn rank 1 of any skill without a family prerequisite. Ranks within each skill must be learned sequentially: rank 1 costs 1 point, rank 2 costs 2 additional points and rank 3 costs 4 additional points. No family choice locks another family and no preliminary class investment is required. Character builds emerge from where players spend points and which learned skills they equip; there is no separate specialization/mastery ladder.

[agent-decided · accepted] Players may reset their learned skill board for free only at the village centre and while outside combat. Resetting refunds every spent skill point, removes the attribute gains granted by the refunded ranks and recalculates Strength, Resistance and Intelligence from the new purchases. Personal level, accumulated experience and unlocked active/passive slot capacity remain unchanged. The reset cannot be performed from the islands or during combat.

Owner decision: Any skill points remaining after the launch board is maximized stay accumulated and visible for future board expansions. They are not converted or discarded, and persist through village cycles and skill-board resets.

## Existing constraints retained

Basic attack plus separate active and passive equipped slots that expand to five of each (owner revision). [agent-decided · accepted] Personal levels 1/5/10/20/30 automatically unlock 1/2/3/4/5 slots of each type, without spending skill points; unlocks persist across village cycles. Active cooldowns remain part of the design. Owner revision: active abilities consume a shared personal aura bar; the prior no-resource rule is superseded. [agent-decided · accepted] Aura recovers automatically, slowly in combat and faster out of combat. Basic attacks cost no aura. [agent-decided · accepted] Provisional base aura capacity: 100. Base regeneration: 2 aura/second in combat, 5 aura/second outside combat. [agent-decided · accepted] Each gained Intelligence point adds 2 maximum aura: 100 + 2 × Intelligence gained above the initial value. Starting Intelligence is 1. Intelligence alone does not increase aura regeneration; [agent-decided · accepted] Provisional magic and healing effectiveness multiplier = 1 + 0.03 × Intelligence gained above the starting value. Apply this linear multiplier once to the base effect; each gained Intelligence point adds 3%, not 3% compounded. This does not change cooldowns, ranges or aura regeneration. Equipped Mage passive multiplies regeneration by its rank bonus. Initial active costs are specified below; other costs remain open. [agent-decided · accepted] If current aura is below an active skill cost, the skill does not activate, spends no aura and does not start its cooldown. Briefly flash the skill control and aura bar, showing the missing aura amount. Do not interrupt movement or basic attacks. [agent-decided · accepted] Combat state starts or refreshes on attacking, taking damage or healing a combat participant and ends after 8 seconds without these actions (provisional). It changes aura regeneration only; the aura bar indicates the recovery state. Common skill points earned at one per personal level-up, one initial point, no village-level gate, and sequential per-skill rank costs of 1/2/4 remain current unless revised. Passives require a passive slot and apply automatically while equipped. Character attributes are Strength, Resistance and Intelligence. [agent-decided · accepted] Strength improves physical damage including physical robot shots; Resistance improves maximum health and reduces incoming damage; [agent-decided · accepted] start with 100 health, adding 5 maximum health for each Resistance point gained above the starting value. [agent-decided · accepted] Provisional Resistance damage reduction = Resistance gained / (100 + Resistance gained): about 9% at 10, 23% at 30 and 33% at 50. It never reaches immunity. Apply it before the equipped Warrior passive, which reduces the remaining damage. Starting Resistance is 1; Intelligence improves magic/healing potency and maximum aura. Movement improves through its skill-board upgrades. Owner revision: attributes grow automatically based on the skill-board path; there are no manually allocated attribute points. Explorer gives +2 to each attribute. Warrior emphasizes Strength and Mage emphasizes Intelligence. Attributes are awarded when learning a skill of the corresponding type. [agent-decided · accepted] Each newly learned rank repeats its branch attribute increment. Starting Strength, Resistance and Intelligence are each 1. Remaining derived-stat formulas stay open.

The native DCL paraglider remains available from the start, per the owner's platform description. The proposed flight path must add a distinct movement ability rather than sell access to the native paraglider. Flight and teleport effects are design intentions; SDK implementation and exact controls are unresolved. Do not promise arbitrary engine-level avatar speed or flight changes as verified capabilities.

## Current progression rule

[agent-decided · accepted] The launch board has 12 skills with three sequential paid ranks apiece. The complete board costs 84 points. Skill ranks are the only specialization progression at launch; do not add separate job titles, paths, or promotion requirements. The skill list and effects in the main GDD are authoritative; provisional numerical balance remains adjustable.




## Attribute growth through the board

| Path | Strength | Resistance | Intelligence | Status |
|---|---:|---:|---:|---|
| Warrior | +3 | +2 | +1 | [agent-decided · accepted] Confirmed for each learned rank. |
| Mage | +1 | +2 | +3 | [agent-decided · accepted] Owner refers to learning Mage skills using this rule. |
| Explorer | +2 | +2 | +2 | Owner-confirmed values. |

Owner-confirmed trigger: learning a skill grants the attribute increment associated with its branch. Equipping or switching an already learned skill does not grant it again. [agent-decided · accepted] Improving to rank 2 or rank 3 repeats that same increment once per rank learned. The amount is not multiplied by the points spent; equipping and swapping never re-award attributes. Do not award a separate manually assigned attribute point on character level-up. The accepted one skill point per level-up remains unchanged.


[agent-decided · accepted] Robot active/passive slot capacity develops separately from attributes. Intelligence affects magic, healing and maximum aura, not the number of slots. Active movement skills consume aura, while native movement and the native paraglider stay outside that cost rule. [agent-decided · accepted] The personal-level schedule 1/5/10/20/30 is accepted provisionally, unlocking 1/2/3/4/5 slots per type.




## Health recovery

[agent-decided · accepted] Health recovery: once the character is outside combat under the accepted 8-second combat-state rule, health regenerates at 2% of maximum health per second. Taking damage or re-entering combat stops this recovery. The unlocked infirmary restores full health immediately and free of charge. Plant-based potions remain distinct because they may be used during combat. Defeat returns the player to the village at full health while preserving the already accepted progression, carried resources and items.

## Skill swapping

[agent-decided · accepted] Swap active and passive skills at any time, including in combat. Cooldowns remain attached to abilities while unequipped. Passive changes never refill health or aura. Combat state does not lock the board.




## Confirmed initial passive skills

[agent-decided · accepted] Equipped passives only. Each follows the three-rank cost structure (1/2/4) and learning each rank awards its branch attributes.

| Branch | Passive effect |
|---|---|
| Explorer | Increased movement speed. |
| Warrior | Reduced incoming damage. |
| Mage | Increased aura regeneration. |

[agent-decided · accepted] Provisional totals at ranks 1/2/3: movement speed +5%/+10%/+15%; damage reduction 5%/10%/15%; aura regeneration +10%/+20%/+30%. A higher rank replaces the lower effect; rank percentages do not stack. Combination with base attributes, active skills and temporary items remains open. Movement-speed behaviour is a design requirement, not a verified SDK capability. These replace the earlier gathering-yield, maximum-health and healing-effectiveness passive proposals.


## First Explorer active — accepted

[agent-decided · accepted] Temporary movement-speed boost delivered by the companion robot, with an aura cost and cooldown. This is the first Explorer active; flight and teleportation come later. [agent-decided · accepted] Provisional Boost rank values: rank 1 +20% speed for 4 seconds; rank 2 +30% for 5 seconds; rank 3 +40% for 6 seconds. All ranks cost 15 aura and have a 15-second cooldown. Effects are rank totals. Final naming and later unlock conditions remain open. [agent-decided · accepted] Explorer movement-speed effects stack additively: equipped speed passive percentage + active Boost percentage. Example at rank 3: +15% passive +40% Boost = +55% total while Boost is active. This affects the game ability modifiers only and does not alter native paraglider rules. Native movement/paraglider availability is unchanged.



## First Warrior active — accepted

[agent-decided · accepted] Impact Pulse (Pulso de impacto): the floating robot emits a short forward burst damaging nearby hostile monsters. Physical damage scales with Strength. [agent-decided · accepted] Provisional rank 1/2/3 damage: 150%/200%/250% of basic-attack damage per affected enemy. Range is 3 metres, aura cost 20 and cooldown 8 seconds at every rank. Rank damage percentages replace one another. Exact frontal width/angle and damage formula remain open. Peaceful wildlife and allies are not targets.


## First Mage active — accepted

[agent-decided · accepted] Healing Pulse (Pulso curativo): the robot emits a wave that heals the user and nearby allies. Provisional rank 1/2/3 base healing is 15%/22%/30% of each recipient's maximum health. Radius 4 metres, aura cost 25, cooldown 12 seconds at every rank. Intelligence multiplies base healing by 1 + 0.03 × gained Intelligence [agent-decided · accepted]. Rank percentages replace one another.




## Second Mage active — accepted

[agent-decided · accepted] Arcane Bolt (Descarga arcana) is the second Mage active skill. The floating robot launches a magic projectile at one hostile monster. Rank 1 deals 30 base magic damage to its target. Rank 2 deals 45 to its target and 20 to other hostile monsters within 2 metres of impact. Rank 3 deals 60 to its target and 35 to other hostile monsters within 3 metres. Multiply both direct and area damage by the accepted Intelligence effectiveness multiplier. Every rank has 15-metre range, costs 25 aura and has an 8-second cooldown. Rank values replace one another; they are not cumulative. Peaceful wildlife and allies cannot be targeted.


## Third Mage active — accepted

[agent-decided · accepted] Link Field grants its caster combat participation credit when an ally inside the field lands an attack that deals at least 1 actual point of bonus damage from the field. Each such qualifying hit refreshes the caster's 20-second participation window. The caster receives the normal enemy defeat reward only once, even if also dealing damage or healing. Maintaining a field without an ally benefiting from its damage bonus grants no combat credit.

[agent-decided · accepted] Link Field (Campo de enlace) is the third Mage active skill. For a limited duration, the floating robot projects an aura around its user. The user and nearby players deal more physical and magic damage while they remain inside the field, without requiring a formal party. Provisional ranks 1/2/3 grant +10%/+15%/+20% damage in a 4/5/6-metre radius for 5/6/7 seconds. Every rank costs 30 aura and has a 20-second cooldown. When fields overlap, each affected player receives only the strongest bonus; bonuses do not stack. Intelligence does not increase this percentage. Rank values replace one another; they are not cumulative.


## Physical attack formula

[agent-decided · accepted] The companion robot executes the basic attack as a physical projectile. One press or tap fires once at a hostile target within 6 metres, with a minimum 1-second interval between shots, no automatic repetition and no aura cost. Damage uses the accepted formula 10 + Strength gained above the starting value. Light targeting assistance selects the hostile enemy nearest the centre of the screen within range. Peaceful fauna and players are never valid targets. Precision Shot remains distinct through its 12/15/18-metre range and rank damage multipliers.

[agent-decided · accepted] Provisional basic damage = 10 + Strength gained above the initial value. Impact Pulse uses this result multiplied by 1.5/2/2.5 according to rank, without double-counting Strength. Starting Strength and enemy mitigation remain open.







[agent-decided · accepted] Defensive reductions apply sequentially to remaining damage in this order: Resistance formula, equipped Warrior passive, Defensive Module, protective amulet, then Kinetic Shield. They do not add their percentages directly and cannot produce immunity. After all reductions, round to the nearest whole point, with a minimum of 1 damage for any successful hit.

[agent-decided · accepted] Provisional useful-item effects: the plant-based potion immediately restores 50% of the user's maximum health and may be repeatedly consumed while inventory remains; the gathering tonic adds 2 units to every collected node for 10 minutes, turning the five-unit base yield into seven; the protective amulet reduces remaining incoming damage by 20% for 10 minutes, after Resistance and the equipped Warrior passive but before Kinetic Shield. Only one tonic and one amulet effect may be active at a time. Using another copy refreshes its duration rather than stacking magnitude.

[agent-decided · accepted] Equipment and skill/item bonuses of the same effect type add together within that type. Example: an Epic Robot Core granting +20% active-skill damage plus Link Field rank 3 at +20% yields +40% active-skill damage while inside the field. Damage-reduction sources remain sequential layers in the accepted order (Resistance, Warrior passive, protective amulet, Kinetic Shield); a Defensive Module is added as another separate reduction layer after the Warrior passive and before the protective amulet. Reductions are not added directly, and total mitigation never grants immunity.

## Second Explorer active — accepted

[agent-decided · accepted] Ascension is the second Explorer active skill. The companion robot gives the character a vertical boost and brief controlled aerial movement, after which native paraglider travel can continue normally. All ranks cost 25 aura and have a 20-second cooldown. [agent-decided · accepted] Provisional ranks 1/2/3 provide 3/5/7 metres of vertical boost and 1.5/2/2.5 seconds of controlled aerial movement. Values are rank totals, not cumulative. The skill does not replace or gate the native paraglider.


## Third Explorer active — accepted

[agent-decided · accepted] Phase Jump is the third Explorer active skill. The robot teleports the character only to eligible world travel points that the character has already visited; arbitrary coordinates are not allowed. All ranks cost 35 aura and have a 30-second cooldown. [agent-decided · accepted] Rank 1 reaches visited points on the current island; rank 2 also reaches visited points on directly connected islands; rank 3 reaches any visited eligible point in the world. Island-connection data and eligible point definitions come from level design. Exact world-point placement belongs to level design.


## Second Warrior active — accepted

[agent-decided · accepted] Kinetic Shield is the second Warrior active skill. The companion robot creates a temporary personal barrier that reduces incoming damage. Apply it after Resistance, the equipped Warrior passive and the protective amulet, reducing the remaining damage. [agent-decided · accepted] Provisional ranks 1/2/3 reduce the remaining incoming damage by 20%/30%/40% for 4/5/6 seconds. Every rank costs 25 aura and has an 18-second cooldown. Rank values replace one another; they are not cumulative. It protects only the user; group protection belongs to a later skill.


## Third Warrior active — accepted

[agent-decided · accepted] Precision Shot is the third Warrior active skill. The floating robot fires directly at one hostile monster at range; the avatar performs no bow gesture. It deals physical damage based on the same Strength-scaled basic-attack formula, then applies its rank multiplier. Provisional ranks 1/2/3 deal 200%/275%/350% of basic-attack damage at 12/15/18 metres. Every rank costs 25 aura and has a 10-second cooldown. Rank values replace one another; they are not cumulative. Peaceful wildlife and allies cannot be targeted. Exact targeting assistance remains open.














