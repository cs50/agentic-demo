# The Agentic Software Engineer

The slides for a CS50 lecture on agentic software engineering, and everything that ran during it: a live demo in which an agent turns Week 1's `mario.c` into a playable game under a PS4 controller, a hub that let the room vote and follow along from their phones, and a finale in which the CS50 duck walks Harvard Yard and battles a monster that speaks in AI slop. The examples come from CS50 Finance and CS50 Mario, so if you have finished Problem Set 9 you can read all of them.

## Just want the slides?

Download the PDF from the [latest release](https://github.com/cs50/agentic-demo/releases/latest): [**the-agentic-software-engineer.pdf**](https://github.com/cs50/agentic-demo/releases/latest/download/the-agentic-software-engineer.pdf). It is rebuilt from `main` on every change. The interactive parts, the demo, the voting and the finale, only exist in the running deck, which is what the rest of this page is about.

## Run the deck

You need [Node.js](https://nodejs.org) 22.12 or newer and [pnpm](https://pnpm.io) 11.

```sh
git clone https://github.com/cs50/agentic-demo.git
cd agentic-demo
pnpm install
pnpm dev
```

The deck opens at <http://localhost:3030>.

| Key | Does |
| --- | --- |
| `→` / `←` | Next and previous step. Every visualization is driven by `→`, so you never need a mouse. |
| `o` | Overview of all slides |
| `p` | Presenter view, with the notes for each slide |
| `f` | Fullscreen |

Hovering a line, a label or a card on a visualization usually shows more. The slide notes (in the presenter view) are what was said in the room.

### The live demo

On slide 53 the game appears with two things missing: gravity, and the level. Both are added by editing two files while the deck runs:

- `demo/mario/physics.ts`: make `applyGravity()` pull the duck down. The solution is 0.8 pixels per frame², capped at 16.
- `demo/mario/level.ts`: return the rows of a level, `#` for a block. The solution is the Week 1 pyramid as a loop inside a loop.

Save and the game changes under the duck, no reload. Press `→` on the slide to open the code beside the game; **Edit** turns the panel into an editor, or use any editor you like. A file that doesn't compile keeps the previous version and shows the error. `pnpm demo solve` writes the finished versions in; `pnpm demo reset` puts the starting ones back.

Play with a PS4 controller (press a button once so the browser sees it) or click the game and use the arrows, `A`/`D` and `Space`.

### The finale

The last slide before the end is the game in Harvard Yard. Arrow keys or `W A S D` to walk, `Space` or `Enter` to talk to people and to confirm. Walk to the Science Center to challenge the Gym; each of Sloppyclaude's moves comes with a question from the lecture, and with no room connected you answer it yourself: `↑` `↓` to pick, then `Space`. Ten right answers win.

## Run it with phones (optional)

In the lecture, phones joined a hub to vote and to follow the slides. The hub is one small Node process in `server/`, and you can run it on your laptop for a room on the same wifi. Nothing needs an account anywhere.

1. Copy `.env.example` to `.env.local` and set `VITE_HUB_URL` to your laptop's address on the wifi, for example `ws://192.168.1.20:8080`, and `PRESENTER_TOKEN` to any string. (`ipconfig getifaddr en0` on macOS or `hostname -I` on Linux gives the address; `ws://localhost:8080` is fine when you are alone.)
2. `pnpm hub` starts the hub on port 8080.
3. `pnpm dev` starts the deck, which connects as the presenter. Slide 2 shows a QR code and a live count of who has joined.
4. On a phone, open `http://192.168.1.20:8080/join` (your address) to vote, or `pnpm build` first and then open `http://192.168.1.20:8080` on the phone to follow the slides as they move.

If slide 2 says *presenter token rejected*, the deck and the hub disagree on the token; restart `pnpm dev` after editing `.env.local`.

## Commands

| Command | Does |
| --- | --- |
| `pnpm dev` | The deck at <http://localhost:3030> |
| `pnpm hub` | The audience hub on port 8080 |
| `pnpm build` | Builds the deck into `dist/`, which the hub serves |
| `pnpm export` | The PDF, as `slides-export.pdf` |
| `pnpm test` | The tests |
| `pnpm demo status` / `reset` / `solve` | The live demo's two files: where they are, back to the start, or finished |

## More

- [How the deck is built](./docs/how-it-is-built.md): the design, each visualization, the live demo's rules, the hub's protocol, the finale, and a map of every file.
- [Presenting and maintaining](./docs/presenting.md): the checklist for giving the lecture, conventions for changing the deck, and how the CS50 copy is hosted.
- [SECURITY.md](./SECURITY.md) for anything about the hub's security.

## License

The code is MIT; the lecture content (slides and notes, the Prompt Index, the finale's questions and dialogue, the artwork) is [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), as CS50's course materials are. Details in [LICENSE](./LICENSE).
