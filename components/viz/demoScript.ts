/**
 * demoScript.ts — the conversation between the student and the agent that
 * turns a vague request into a specification, across several slides.
 *
 * Every factual claim here is checked against the code in demo/mario:
 * button 0 is Cross, axis 0 is the left stick, the D-pad is buttons 14/15,
 * the engine steps at 60 Hz, physics.ts holds gravity 0.8 and jump -14,
 * level.ts is a nested loop, and the engine owns its Controller (it is
 * handed a World and a Physics).
 */

export type Feasible = 'yes' | 'maybe' | 'no'

export interface Choice {
  name: string
  /** Shown on the card. */
  blurb?: string
  feasible: Feasible
  /** Shown in the panel on hover or focus. */
  detail: string
  /** The option the student takes, if any. */
  picked?: boolean
}

export interface Risk {
  task: string
  /** 0 = done this in CS50, 1 = brand new. Positions the dot horizontally. */
  unknown: number
  /** Row on the scale, so labels do not collide. */
  lane: number
  week?: string
  detail: string
}

export type Turn =
  | { who: 'you' | 'agent'; text: string }
  | { who: 'agent'; text: string; choices: Choice[]; prompt?: string }
  | { who: 'agent'; text: string; spec: string[] }
  | { who: 'agent'; text: string; risks: Risk[] }

export interface Scene {
  id: string
  /** One line for the "so far" strip on later slides. */
  summary: string
  turns: Turn[]
}

export const scenes: Scene[] = [
  {
    id: 'ask',
    summary: 'A vague request; the agent asks before it builds',
    turns: [
      { who: 'you', text: 'I\u2019d like to build a simple Mario-style game that works with a controller in the browser.' },
      {
        who: 'agent',
        text: 'Happy to. Before I write anything, three things I can\u2019t infer from that sentence, and getting any of them wrong wastes an hour:',
        spec: [
          'What controller? The browser can see some devices and not others.',
          'What does "Mario-style" mean here: a character that runs and jumps over the Week 1 pyramid?',
          'What should happen when the controller isn\u2019t there?',
        ],
      },
      { who: 'agent', text: 'Let\u2019s start with the controller, because that one decides what is even possible.' },
    ],
  },
  {
    id: 'controller',
    summary: 'A DualShock 4 over Bluetooth; the browser has an API for it',
    turns: [
      {
        who: 'agent',
        text: 'What kind of controller do you have?',
        prompt: 'Some of these the browser can read. Some it cannot. One of them is a spoon.',
        choices: [
          { name: 'PS4 controller', blurb: 'DualShock 4', feasible: 'yes', picked: true, detail: 'Over USB or Bluetooth. Chrome exposes it through the Gamepad API with the "standard" mapping: 17 buttons and 4 axes with fixed numbers. Cross is button 0, the left stick is axes 0 and 1.' },
          { name: 'Xbox controller', feasible: 'yes', detail: 'Same API, same standard mapping, so the same code. Only the names differ: the browser\u2019s button 0 is Cross on a DualShock and A on an Xbox pad.' },
          { name: 'Steering wheel', feasible: 'maybe', detail: 'Shows up as a gamepad, with axes for the wheel and pedals, but usually without the standard mapping: button numbers differ by model. Feasible, after a mapping step and a lot of swerving.' },
          { name: 'Guitar Hero guitar', feasible: 'maybe', detail: 'Some are plain USB gamepads and just work; the Bluetooth ones need a bridge. Strum to jump has a certain appeal.' },
          { name: 'Wii Remote', feasible: 'no', detail: 'Bluetooth, but not a gamepad the browser recognizes. It needs a native helper program to translate, which is another project.' },
          { name: 'A fork', feasible: 'no', detail: 'Not an input device. The browser cannot see it. Unless you wire it to a Makey Makey, which turns anything conductive into a keyboard key. Then it is a keyboard.' },
          { name: 'A spoon', feasible: 'no', detail: 'See the fork. Rounder; otherwise the same analysis.' },
          { name: 'The keyboard', feasible: 'yes', detail: 'Already works, and you already know how: keydown events, Week 8. Worth keeping as a fallback for when the controller is off.' },
        ],
      },
      { who: 'you', text: 'A PS4 controller, over Bluetooth.' },
      {
        who: 'agent',
        text: 'Good. The browser has an API for exactly that, the Gamepad API, and Chrome gives a DualShock 4 a fixed button layout, so I won\u2019t have to guess which number is which. Here is the specification so far:',
        spec: [
          'A browser game: a character runs and jumps over the Week 1 pyramid.',
          'Input: a DualShock 4 over Bluetooth. Cross jumps; the left stick or D-pad moves.',
          'If the controller is absent or disconnects, the game keeps running and the keyboard works.',
        ],
      },
    ],
  },
  {
    id: 'design',
    summary: 'TypeScript on plain browser APIs; five modules, one job each',
    turns: [
      {
        who: 'agent',
        text: 'Two decisions are yours, not mine. First, the language. Everything below can be made to run in a browser; they differ in what you pay for it.',
        choices: [
          { name: 'TypeScript', blurb: 'Canvas, requestAnimationFrame, the Gamepad API', feasible: 'yes', picked: true, detail: 'The browser\u2019s own language. Drawing, timing and the controller are all plain browser APIs; no runtime to download, and a bundler such as Vite reloads a saved file in place. You wrote JavaScript in Week 8.' },
          { name: 'Python', blurb: 'pygame, or Pyodide in the browser', feasible: 'maybe', detail: 'pygame cannot run in a browser. Pyodide can: CPython compiled to WebAssembly. But it has no controller access of its own, so Python would call the Gamepad API through a JavaScript bridge every frame, after a download of several megabytes. The hard part stays in JavaScript.' },
          { name: 'C', blurb: 'SDL2, compiled with Emscripten', feasible: 'maybe', detail: 'A real option: Emscripten maps SDL2 onto Canvas and WebGL, and SDL\u2019s joystick API onto the Gamepad API. Week 1\u2019s language in a tab. The cost is a toolchain and a rebuild after every edit, which rules out changing the level while it runs.' },
        ],
      },
      { who: 'you', text: 'TypeScript. We know the APIs from Week 8, and I want to edit the level while it runs.' },
      {
        who: 'agent',
        text: 'Then the shape. I\u2019d split it by job, so each piece can be checked on its own and changed without touching the others:',
        choices: [
          { name: 'controller.ts', blurb: 'reads the gamepad', feasible: 'yes', detail: 'Polls the Gamepad API each step and turns it into two facts: how far left or right, and whether jump was just pressed. Knows the DualShock\u2019s numbers. Knows nothing about ducks or pyramids. Also listens to the keyboard as a fallback.' },
          { name: 'engine.ts', blurb: '60 steps a second, collisions, drawing', feasible: 'yes', detail: 'A fixed 60 Hz step regardless of the screen\u2019s refresh rate; collision against tiles; drawing. Owns one controller; is handed the world and the physics, and can be handed new ones while it runs. Knows nothing about Bluetooth or gravity.' },
          { name: 'physics.ts', blurb: 'gravity and the jump', feasible: 'yes', detail: 'Two numbers and one function: the speed a jump starts with, and what happens to the vertical speed every frame. Gravity 0.8 px per frame squared, jump \u221214, a terminal velocity of 16. Small enough to read aloud, which is the point: this is the arithmetic from Week 1.' },
          { name: 'level.ts', blurb: 'the pyramid, as a loop inside a loop', feasible: 'yes', detail: 'mario.c in TypeScript: for each row, so many spaces then so many hashes, returning strings. The one file we will edit live. Readable in one glance.' },
          { name: 'world.ts', blurb: 'rows of # into tiles', feasible: 'yes', detail: 'Turns the strings into a grid of solid tiles on a ground row, centred. Knows nothing about where the strings came from.' },
          { name: 'one file instead', blurb: 'everything in one script', feasible: 'maybe', detail: 'It would run. But a controller bug and a physics bug would share two hundred lines, nothing could be tested alone, and any change means re-reading all of it. This is the shape you get when you only say "build it".' },
        ],
      },
      { who: 'you', text: 'Modules. And keep the level as the Week 1 loop, so the room can read it.' },
    ],
  },
  {
    id: 'risk',
    summary: 'The controller is the one unknown; verify it before building',
    turns: [
      {
        who: 'agent',
        text: 'Before I build any of it: which part are we least sure of? Everything here is something you have done, except one.',
        risks: [
          { task: 'Draw a sprite on a canvas', unknown: 0.04, lane: 0, week: 'Week 8', detail: 'A canvas, a context, fillRect in a loop. You did this.' },
          { task: 'Move it with the keyboard', unknown: 0.16, lane: 2, week: 'Week 8', detail: 'keydown and keyup events. Familiar.' },
          { task: 'Gravity and a jump', unknown: 0.3, lane: 3, week: 'Week 1 arithmetic', detail: 'A velocity, a constant added each step, a sign flip. Easy to test with numbers.' },
          { task: 'The pyramid from a loop', unknown: 0.06, lane: 1, week: 'Week 1', detail: 'You wrote this in C already.' },
          { task: 'Read a PS4 controller in the browser', unknown: 0.96, lane: 1, week: 'New', detail: 'A new API. Bluetooth pairing. Does this browser expose the pad at all? Which number is Cross? Does it report before a button is pressed? (It does not.) Four unknowns in one line of the spec.' },
        ],
      },
      { who: 'you', text: 'The controller. Everything else is Week 8.' },
      {
        who: 'agent',
        text: 'Then the first thing I write is not the game. It is a small page that prints every button and stick event the browser sees. If it prints "Button 0 (CROSS): DOWN" when you press \u2715, we build the game on top of it. If it prints nothing, nothing else we planned matters, and we have lost ten minutes instead of a day.',
      },
    ],
  },
]

export function sceneIndex(id: string) {
  return scenes.findIndex((s) => s.id === id)
}
