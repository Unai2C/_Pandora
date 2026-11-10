export function playerUpgrades(level:number){const gained=Math.max(0,Math.floor(level)-1);return {maxHealth:100+10*gained,damageBonus:2*gained}}
