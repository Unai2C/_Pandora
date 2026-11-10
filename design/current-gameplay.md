# Current gameplay rules

Updated following the inventory and skill-tree redesign.

- Inventory contains carried wood, stone and fruit, plus recovery information.
- Runes, rune bonuses, potions and purchases of those items are removed. Legacy requests cannot grant or use them.
- Health recovers within 7 horizontal metres of the base of the village tree, with a vertical tolerance of 5 metres. Base recovery is 5% of maximum health per second. Health does not regenerate elsewhere.
- Aura regenerates everywhere: 5 points per second normally, 2 during combat, capped at maximum aura.
- Exactly three shared skill slots are available from the start. Any learned skill may occupy a slot. Duplicates are not allowed.
- Skills with continuous effects use the same three slots as skills that are triggered by the player. They are not presented as separate categories.
- Explorer: Boost → Swift Movement → Ascension → Phase Jump.
- Warrior: Impact Pulse → Damage Reduction → Kinetic Shield → Precision Shot.
- Mage: Arcane Bolt → Aura Regeneration → Tree Affinity → Link Field.
- Learning the next node requires rank 1 of its parent. Rank costs remain 1, 2 and 4 skill points.
- Tree Affinity replaces Healing Pulse, retaining its stored identifier to preserve learned ranks. It improves healing near the tree by 10/20/30% while equipped.
- Existing learned ranks, coins and XP are retained. Legacy equipped skills migrate to at most three unique learned skills. Retired inventory fields are stripped from loaded profiles.

Validation: `node --test tests/gameplay-rules.test.cjs` and `npm run build`.


## Current playtest: no skills or automatic upgrades
Inventory and Skills menus remain hidden. Manual skills and automatic upgrades are disabled. Hero level tracks experience only; combat attributes remain at base values. Health recovers near the village tree and Aura regenerates gradually at their base rates.

Village delivery transfers all carried wood, stone, fruit and coins. Coins accumulate in the persistent community treasury and appear with a coin icon in the Novaterra HUD. Coins have no new level requirement or spending rule. Existing saved villages start with zero treasury coins. Fractional earned coins are preserved during transfer.

Village coins now use stock/goal like other resources. Coin goal equals half the wood goal (rounded up): 20 at village level 1, 35 at level 2. Village advancement requires all four resources and consumes the corresponding coin goal, carrying surplus forward.

Equipment: click the Sword or Axe icon above the right side of the Novaterra panel to select one tool. E attacks with the sword or chops the nearest wood node within 3.5 metres with the axe. Tool actions have animation-length cooldowns.

The selected sword or axe remains attached to the right hand continuously, including idle, movement, hit reactions and animation failures. Selecting the other tool switches the visible model immediately.

Pickaxe added: 1 selects Sword, 2 Axe, 3 Pickaxe. Each tool button has a keyboard key badge. E mines the nearest stone within 3.5m with Pickaxe. A procedural handheld pickaxe is used until a dedicated model is supplied; mining reuses the chopping swing animation.

Tool combat balance: Sword 20 damage / 1300ms; Pickaxe 14 / 2200ms; Axe 8 / 1500ms. All tools attack nearby enemies with E or enemy clicks. Otherwise Axe/Pickaxe use nearby wood/stone. Clicking wood or stone automatically selects the corresponding tool and updates the selector and handheld model. Server enforces the cooldown of the previous attack even if the player switches tools.

Normalized Sword.glb, Axe.glb and Pickaxe.glb now replace the legacy models and procedural pickaxe. Sword_Attack_emote.glb and Hold_Tool_emote.glb contain avatar animation only. Chop_Axe_emote.glb has no mesh and is used for chopping/mining while the selected tool remains visible, avoiding the embedded axe in PP_Axe_Chop_emote.glb. Clip durations verified from GLB accessors: sword 1.267s, chop 1.467s, hold 3s loop. Visual grip still requires in-game review.

## Ambient agents (current preview)
All nine animated Agentes models roam short routes near the village, using only Idle in a loop. There is no additional vertical bob, combat, player following or class/player assignment in this phase. Each asset has its own scale, including Rose Quartz at 0.25. Collision masks are zero. Existing destination files matched the supplied source byte-for-byte; no assets were overwritten. The earlier companion_robot proposal has no runtime implementation to duplicate; src/agents.ts is the single ambient-agent entry point for now. Other clips remain inactive pending actual companion behavior.

Sentinel Core is the fixed neutral village guide at (80, 3.4, 80). It no longer roams; Idle supplies its hovering. Clicking within 4m opens an English welcome dialogue and plays Greet once, then Idle resumes after 1.5s. The remaining eight agents still roam. No per-player/class assignment was introduced.

## Agent enemies replace Inferno Sentinels
The eight roaming variants are now server-authoritative enemies using the existing combat, rewards and safe-zone logic. Sentinel Core remains the fixed friendly village guide. Each enemy plays Disappear once on defeat (0.9s, loop/shouldReset false), then hides. After 30 seconds the server selects a different spawn at least 10m from the death location; Appear plays for 0.9s before combat resumes. Attack aims +Z at its target, uses the 0.4s telegraph/impact timing, and returns to Idle after 1.3s. No Inferno models or duplicate ambient versions are instantiated.

## Agent combat styles
Ranged (6m firing range): Aqua Sigil Wisp, Celestial Prism Orb, Celestial Resonance B, Rose Quartz Arcana. Melee (2.2m approach distance): Celestial Orbweaver, Ember Golem Orb, Mosslit Sentinel, Void Sentinel. Existing 0.4s wind-up and aimed-position dodge check apply to both; ranged agents show a short energy beam at the shot timing. Sentinel Core stays friendly.

## Memory Shards replace coins
The selected broken memory-module PNG is used in the personal wallet and community resources. All current player-facing coin labels become SHARDS / memory shards. Existing wallet, treasury and village goals are retained 1:1 through legacy internal storage identifiers. Each defeated enemy awards exactly one shard total to the final hitter; other contributors retain shared XP, with no shard multiplier or hunt milestone bonus. Existing non-combat milestone and cycle rewards keep their amounts, now denominated in shards.

Agents now have physical box colliders combined with pointer collision; no duplicated GLB mesh collisions. Enemy colliders are disabled while defeated/appearing and restored when alive. Sentinel Core has a fixed physical/pointer collider. Aura UI is hidden and the personal HUD compressed to keep only Health.

## Shard balance revision
Exactly one new shard per defeated agent (one total, awarded to final hitter). Gathering milestones and village cycles no longer award shards; cycles retain their badge. Existing saved wallet and community stock remain intact. Requirements for village levels 1–13: 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24 shards. Wood/stone/fruit goals are unchanged.

## Death flow
Lethal damage leaves health at zero and plays Death_emote.glb, interrupting active swings. Player movement/actions are disabled; the scene fades to black from 1.6s to 3s and GAME OVER appears at 3.6s. CONTINUE waits for the village move request before revealing gameplay; the server restores health and excludes fallen players from targeting/recovery until Continue. Resources and progression are preserved.

## Pandora V0 Blender scene integration
Source: dcl/compartida/Pandora_V0_20261031.blend (read-only; not saved). Reproducible exporter: scripts/export_scene.py. Export directory: assets/scene/modelos/pandora-v0-20261031. Base and water are separate; water has both collision masks at zero. 235 resources use authored placements (64 wood, 115 stone, 56 fruit), each with separate ON/OFF GLBs. 95 nodes use matching OFF geometry; remaining 25 trees and 115 stone nodes reuse existing stump/plain-stone templates, recentered at the resource. Cooldowns and resource states are server-authoritative and synchronized to joining players. All regenerate after 30s. Central tree variants 01–04 correspond to village levels 1/5/9/13 and switch on village updates (including cycle reset). Old base and placeholder resource models are no longer instantiated. The original palette was recovered from PP_Scene_Base.glb. TWO TEXTURES REMAIN PENDING FROM THE OWNER: texture_gradient.png and AquaTex0.jpg; affected forest/water materials cannot have their original appearance until these files are supplied. Place them alongside the source blend or in the exported textures folder and rerun exporter. Existing GLBs outside the new export folder were preserved.

## Scene textures completed
Owner supplied texture_gradient.png and aquaTex.png in dcl/compartida. The exporter aliases the missing AquaTex0.jpg reference to aquaTex.png and relinks the forest atlas. Files are copied to the generated textures directory and embedded in the refreshed water/forest GLBs. missing-textures.json is now empty. A textured Blender preview was rendered and inspected; original source blend remains unchanged. This resolves the pending-texture note above. Water retains zero collision masks.

Environment material emission is capped at 0.03 (previously 1.0) to prevent bloom and washed-out surfaces. Applied to the generated scene GLBs and reproducible exporter; embedded textures/geometry are unchanged. Agent and tool assets outside this scene export retain their original effects.

Environment emission adjusted to 0.3, retaining texture-coloured emission. Gathering now sends the authoritative resource request only at the animation impact (wood/stone 900ms; fruit 650ms), so ON remains until the gesture lands. Animation interruptions, movement, death or switching to an incompatible tool cancel the pending collection. Shared OFF/respawn timing remains server-controlled.

## Multi-hit harvesting
Resources now have authored sourceName, size and hitsRequired metadata in the manifest and generated worldLayout. Explicit Small/Log/Branch=1, Average/Avarage=2, Big/Large=3. Unlabelled stones use longest horizontal dimension (<1m=1, <1.8m=2, otherwise3); unlabelled trees use height (<5m=1, <9m=2, otherwise3). Distribution: wood 3/52/9, stone 57/32/26, fruit 21/19/16 for small/medium/large. Total 81/103/51. Damage is server-authoritative and shared, synchronized to joiners. Bars appear on partial progress and empty toward the last hit. Rewards and OFF/30s regeneration occur only on the last impact; respawn resets hit progress. Existing yield per completed resource is unchanged.

## Intro and first-player tutorial
Arrival is at (81.55,2,146), the south end of the central path. First entry waits for base/central tree/guide GLBs, then runs an 11s virtual-camera sequence: close view of Sentinel Core, elevated panorama, arrival view of the player. Input is frozen only during the cinematic; SKIP INTRO is available. Tutorial stage is stored in the player profile: 0 intro, 1 fruit, 2 wood (axe unlocked), 3 stone (pickaxe unlocked), 4 enemy (sword unlocked), 5 complete. Characters start empty-handed. Server-confirmed collection advances only the matching stage; enemies ignore players until the combat stage. Instructions and objective markers guide resources and combat, with all UI in English. Progress resumes on re-entry; existing resources/XP are preserved. Tools cannot be selected or used before unlocking.
