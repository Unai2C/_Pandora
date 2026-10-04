# Pandora — economy and launch items

**Status:** owner decisions and proposed balance are separated. Values marked `[agent-decided]` are defaults to review, not tested results. This file supersedes older GDD passages that treat crystals as currency or describe non-rune equipment.

The coin amounts, milestone cadence, shop prices/effects, item-use cooldown and rune salvage values in `proposal-defaults.md` were approved as initial defaults on 2026-10-04. They remain untested balance values.

## Owner-approved launch rules

- The personal shop currency is **town coins**. This is story language only: balances are server-side; no blockchain token, transfer or redemption exists.
- Coins are earned through opening chests, completing always-active personal objectives, selling eligible found items and defeating enemies. Gathering may award coins through objectives, not per node by default. Objectives are automatic and never accepted from a quest board.
- Shared village materials and chest Supply Bundles are delivered to the village. They cannot be sold for personal coins or withdrawn from common stock.
- Chests award Supply Bundles and guaranteed town coins, with a chance of personal runes on Rare and Ancient tiers. Launch chests do not award consumables or crystals. Opening is one press; the chest disappears for everyone after the finder resolves the reward choice.
- Personal equipment is **runes**. Each character has three universal equipped rune slots and an unlimited personal rune collection. A rune may improve Strength, Resilience and/or Intelligence; it grants at most one ability. Duplicate runes remain separate and do not combine.
- Initial ability-rune trio [agent-decided · accepted]: Strength grants Precision Shot, Resilience grants Boost, and Intelligence grants Healing Pulse. Each also grants +1 to its matching attribute. These are existing abilities and work only while the matching rune is equipped. This +1 is an initial untested balance value.
- Skill-board abilities are permanent. Rune-granted abilities exist only while that rune is equipped and use the current active/passive skill slots, aura costs and cooldown rules. Launch rune abilities come from the existing skill catalogue; expansions may add new abilities and runes.
- Runes are found in chests or bought in a basic shop selection. Shop runes provide predictable attribute bonuses; ability-granting runes are chest rewards only and may drop only from Rare or Ancient chests. When a chest finds a rune, its opener chooses to equip/store it, exchange it with an equipped rune, or sell it. Any displaced equipped rune returns to personal storage. Bought items cannot be resold. A rune duplicating a permanent skill remains useful for its attribute bonus or can be sold.
- The launch shop also sells one health consumable and one aura consumable. Both can be used in combat; each is consumed on use. They are not chest rewards.
- Physical crystals are objects reserved for a future expansion, not launch currency or inventory. One-use grimoires are also expansion content.
- Reuse Alien Scrapyard's server-side balance, shop/inventory logic and exact menu/HUD dimensions and positions. Adapt the item rules; do not carry over round-limited artifact behavior.

## Proposed coin amounts `[agent-decided]`

| Event | Default coins |
|---|---:|
| Qualifying normal enemy defeat | 2 per eligible player |
| Qualifying elite enemy defeat | 5 per eligible player |
| Qualifying guardian/boss defeat | 15 per eligible player |
| Common / rare / ancient chest coin reward | 5 / 15 / 30 guaranteed per opened chest |
| Completed 13-level village cycle | 100 coins [owner-approved] per eligible participant, plus exclusive badge |
| Each 100 lifetime resource units gathered | 10 milestone coins |
| Each 10 eligible enemy defeats | 10 milestone coins, in addition to direct enemy rewards |
| Each 5 opened chests | 10 milestone coins, in addition to chest contents |
| Found rune sale | 5 / 10 / 20 / 40 coins for Common / Rare / Epic / Legendary |

Milestones are always active, automatic, personal, cumulative and repeat at each threshold; they do not add extra village progress. Gathering advances the personal collection counter when gathered, but advances village needs only after delivery. Apply the accepted 25% collaboration bonus to each eligible player's direct enemy coin award when at least two people qualify, matching the existing XP collaboration rule. No award is split from a shared pool.

## Proposed shop defaults `[agent-decided]`

| Item | Price | Effect |
|---|---:|---|
| Strength / Resilience / Intelligence attribute rune | 25 coins each | +1 to the named attribute; no ability. |
| Health supply | 10 coins | Restores 50% of maximum health. |
| Aura supply | 10 coins | Restores 50% of maximum aura. |

Both supplies are one-use items and may be used during combat. [agent-decided] Use the two existing quick-use HUD slots for health and aura supplies without moving or resizing them. Shared item-use cooldown: 5 seconds. Purchased items cannot be sold. Sell values above apply only to eligible found runes.

Chest quality defaults: common/rare/ancient chests carry 1/3/6 Supply Bundle units and guarantee 5/15/30 coins; common chests do not drop runes; rare chests have a 25% chance of one Rare rune; ancient chests have a 70% rune chance, split 60% Rare / 30% Epic / 10% Legendary. These drop odds are provisional balance values.

## Largest remaining decisions

1. **Balance validation:** approved launch coin amounts, item prices, milestone cadence and rune sale values are initial assumptions; their feel in actual progression is untested.
2. **Rune content:** starting mappings, +1 attribute bonuses and Rare/Ancient drop rules are set. Exact added rune variants are outside the current launch definition.
3. **Village balance:** plan around about four regular contributors and target roughly two weeks per cycle; timing and resource requirements remain untested.
4. **Production:** all three islands and phase catalogues are in the initial design scope. Team capacity, technical limits, final asset counts and delivery schedule remain TBD.
5. **Retention:** primary player, player promise, first-minute flow and comparables are captured. Next-day return is untested (H1-02 remains parked).
6. **Creator Success application details:** target World or coordinates, team/contact, requested round and four-week delivery plan remain incomplete.

## Recommended next order

The initial coin table and core rune set are defined. Keep balance numbers provisional until tested; do not present the cycle duration or retention effect as measured results.
