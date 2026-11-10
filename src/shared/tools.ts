export type ToolKind = 'sword' | 'axe' | 'pickaxe'
export const TOOL_RULES: Record<ToolKind, { damage: number; cooldown: number }> = {
  sword: { damage: 20, cooldown: 850 },
  axe: { damage: 8, cooldown: 1500 },
  pickaxe: { damage: 14, cooldown: 2200 }
}
export function isTool(value: unknown): value is ToolKind { return value === 'sword' || value === 'axe' || value === 'pickaxe' }
