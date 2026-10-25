# PulseSync Play Next

An installable PulseSync addon that puts **Play next** immediately to the **left of Like on the same track row**. Works with search rows, album tracks, liked tracks, and other playlists using Yandex Music's common row layout.

Uses Yandex Music's native Play next icon and track-control colors, hover, and focus styling.

[View the icon placement preview](docs/play-next-preview.png). This isolated preview uses the installed client's icon sprite; it is not a screenshot of an authenticated music session.

Import [`dist/PlayNextInline-1.0.1.pext`](dist/PlayNextInline-1.0.1.pext) into PulseSync by dragging it onto the PulseSync window, then enable **PlayNextInline**. Enabling script addons may reload Yandex Music. See [addon instructions](addon/README.md) for usage and compatibility.

If dragging does nothing on macOS, run this from the project directory:

```sh
open -a PulseSync dist/PlayNextInline-1.0.1.pext
```

This uses PulseSync's native file-opening handler. It successfully imported version 1.0.1 into the installed PulseSync 2.16.0-beta when dropping the file did nothing. Open the addons library and enable **PlayNextInline** after importing.

## Existing addon check

No exact match was found in the installed addons or public PulseSync addon repositories inspected on October 25, 2026. Yandex Music already offers **Play next** in the track context menu; this addon exposes that operation beside Like. The official addon catalog returned `FORBIDDEN`, including through the existing session, so store-only addons could not be ruled out. See [sources and search coverage](docs/existing-addons.md).

## Development

```sh
npm ci
npx playwright install chromium --only-shell
npm run check
npm test
npm run build
```

`addon/` contains the complete runtime: plain JavaScript, CSS, metadata, and an icon. Development dependencies are used only for testing and packaging. `npm run build` creates a ZIP with the `.pext` extension and verifies every packaged file after decompression. Metadata is at the archive root, as PulseSync's importer requires.

See [publishing instructions](docs/publishing.md) for submitting the prepared release to the PulseSync catalog.

## Implementation

The button is inserted as the immediate preceding sibling of the row's native Like button. It uses `injectNext` with the same unloaded track entity shape as Yandex Music's context menu. It never invokes playback or Like handlers. Track and album IDs are resolved when clicked, so React can recycle a row without leaving a stale queue action behind.

The observer batches work with animation frames and scans changed subtrees and their affected rows. Reinjection, script removal, and page unload clean up buttons, listeners, timers, and notifications.

## Validation

Playwright exercises real React 19 fixtures with a simulated queue: inline placement, track/album identity, mouse and keyboard events, double-click suppression, recycled and appended rows, disabled tracks, fallback track links, missing/rejected queue operations, Russian labels, safe title rendering, and cleanup. A narrow-window screenshot is written to `test-results/play-next-narrow.png`.

Integration details were inspected in the locally installed PulseSync 2.16.0-beta / mod 1.33.2 sources (bundled frontend 5.113.2, host compatibility version 5.112.0). The tests do not validate authenticated desktop playback or every third-party theme; verify the queue after importing the addon.
