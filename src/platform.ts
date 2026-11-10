import { getExplorerInformation } from '~system/Runtime'

// Which Explorer is running the scene. The HUD uses a slimmer layout on phones; until the answer arrives (or if the
// call fails) the desktop layout is used.
let mobile = false
export function isMobile() { return mobile }
export function detectPlatform() {
 void getExplorerInformation({}).then(info => { mobile = info.platform === 'mobile' }).catch(error => console.error('[Pandora] Explorer information:', error))
}
