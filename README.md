# QueueButtons

Pick what plays next, right from the track list.

QueueButtons adds **Play next** and **Add to end** beside the Like button in Yandex Music. It works in search results, albums, and Liked tracks through [PulseSync](https://pulsesync.dev).

![QueueButtons preview](addon/images/track-buttons.png)

_Layout illustration with sample tracks._

## How it works

- **Play next** puts a song right after the one you're listening to.
- **Add to end** puts a song after the tracks already in your queue.

Both buttons use Yandex Music's own icons and colors. They sit on the same line as the track, in this order: **Play next → Add to end → Like**. Your current song keeps playing when you click either one.

Use **Add to end** to line up several songs in the order you pick them. If you use **Play next** more than once, the last song you pick goes first.

In **My Vibe**, **Add to end** places songs after your manual queue and before the next recommendations, just like the built-in track menu.

## Install

You'll need PulseSync and the modified Yandex Music desktop client. To build the addon, clone or download this repository and run these commands from its folder with Node.js 24:

```sh
npm ci
npm run build
```

1. Open PulseSync and drag in `dist/QueueButtons-1.1.4.pext`.
2. Enable **QueueButtons** in your addons library. Yandex Music may reload.
3. Open search results, an album, or Liked tracks and look beside the heart.

If dragging does nothing on macOS, run this from the project folder:

```sh
open -a PulseSync dist/QueueButtons-1.1.4.pext
```

If you previously installed **PlayNextInline**, import QueueButtons over it. It's the same addon under a new name.

Keep PulseSync running while you use the addon. You can hide the buttons at any time by disabling QueueButtons.

## A few useful details

- Hover over a button to see its label in English or Russian, following the client's language.
- Use Tab to reach the buttons and Enter or Space to activate them.
- Buttons are disabled for unavailable tracks. If adding a song fails, try its usual track menu.

## Development

The source lives in `addon/` and uses plain JavaScript and CSS. After `npm ci`, run:

```sh
npx playwright install chromium --only-shell
npm run check
npm test
```

`npm run check` runs Biome's formatting and lint checks. Use `npm run format` to format files, or `npm run lint:fix` to apply safe fixes. GitHub Actions also runs the checks, tests, and build.

Packages in `dist/`, installed dependencies, and test reports are ignored by Git. Browser tests use a simulated queue; check playback in the desktop client before publishing.

[Publishing guide](docs/publishing.md) · [Release notes](docs/release-notes-1.1.4.md) · [Original addon search](docs/existing-addons.md)
