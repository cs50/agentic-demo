# Security

The audience hub (`server/`) runs on the public internet during lectures, with a room full of phones connected to it. If you find a way to present without the token, vote more than once per device, read what you should not, or take the hub down, please tell us privately rather than in a public issue.

Use GitHub's private vulnerability reporting on this repository ("Report a vulnerability" under the Security tab). Include what you found, how to reproduce it, and what you think the impact is. We will acknowledge the report, fix what needs fixing, and credit you if you would like.

## What is in scope

- The hub: `server/app.ts`, `server/hub.ts`, `server/public/join.html`.
- The deck's connection to it: `composables/useHub.ts`, `composables/hubSync.ts`.
- The dev-server write channel in `vite.config.ts` (it must accept writes only from the machine running `pnpm dev`, and only to the two live files).

## What is not a vulnerability

- The audience is anonymous by design. One device that opens several sockets with several ids is several voters; the hub keeps one honest socket to one vote and rate-limits every socket, but does not try to tell two phones from one phone with two tabs. See the note at the top of `server/hub.ts`.
- `VITE_PRESENTER_TOKEN` is baked into the *dev* deck on purpose, so anyone who can load your `pnpm dev` server is a presenter. Do not combine it with `slidev --remote` in a room. A production build never contains the token.
