let open = false
const listeners = new Set<() => void>()
export function isVillageGuideOpen() { return open }
export function setVillageGuideOpen(value: boolean) { open = value; for (const listener of listeners) listener() }
export function subscribeVillageGuide(listener: () => void) { listeners.add(listener) }
