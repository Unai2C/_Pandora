// Original supplied audio files; bounded playback keeps effects short.
export const ACTION_SOUNDS = {
 agentRanged:{clips:['assets/sounds/agents/energy-pulse.wav'],seconds:.55,volume:.45},
 agentMelee:{clips:['assets/sounds/agents/mechanical-strike.wav'],seconds:.35,volume:.5},
  "click": {
    "clips": [
      "assets/sounds/pressE.mp3"
    ],
    "seconds": 0.2,
    "volume": 0.5
  },
  "wood": {
    "clips": [
      "assets/sounds/a Single Axe Impact Into A Solid Tree Trunk. Sharp Woody Chop Followed By A ... (1).mp3",
      "assets/sounds/a Single Axe Impact Into A Solid Tree Trunk. Sharp Woody Chop Followed By A ....mp3"
    ],
    "seconds": 1.2,
    "volume": 0.7
  },
  "stone": {
    "clips": [
      "assets/sounds/a Single Pickaxe Striking Stone Videogame Sound.mp3"
    ],
    "seconds": 1.2,
    "volume": 0.7
  },
  "fruit": {
    "clips": [
      "assets/sounds/close-up Sound Of A Ripe Fruit Being Plucked From A Leafy Bush Sound Effect ....mp3",
      "assets/sounds/close-up Sound Of A Ripe Fruit Being Plucked From A Leafy Bush..mp3"
    ],
    "seconds": 1.2,
    "volume": 0.65
  },
  "swing": {
    "clips": [
      "assets/sounds/one Fast Sword Slash Through The Air. Clean, Sharp Blade Whoosh With A Subtl....mp3"
    ],
    "seconds": 0.65,
    "volume": 0.65
  },
  "hit": {
    "clips": [
      "assets/sounds/Videogame Sound Effect Sword Hit (1).mp3",
      "assets/sounds/Videogame Sound Effect Sword Hit.mp3"
    ],
    "seconds": 0.75,
    "volume": 0.7
  },
  "delivery": {
    "clips": [
      "assets/sounds/Short Sound For Video Game Resources Being Accepted By A Communal Futuristic ....mp3"
    ],
    "seconds": 4.344,
    "volume": 0.75
  },
  "levelUp": {
    "clips": [
      "assets/sounds/Video Game a Short Personal Level-up Sound. A Rising Spiral Of Crystalline E....mp3"
    ],
    "seconds": 2.1,
    "volume": 0.75
  },
  "death": {
    "clips": [
      "assets/sounds/a Restrained Defeat Sound For A Stylized Fantasy Sci-fi Adventure. A Soft Bo....mp3"
    ],
    "seconds": 3.5,
    "volume": 0.8
  }
} as const
export type ActionSound = keyof typeof ACTION_SOUNDS
