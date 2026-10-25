# PlayNextInline

Adds **Play next / Играть следующим** immediately to the **left of Like**, on the same line as each track in search results, albums, and liked tracks. Other playlists using the same track rows also work.

Yandex Music already offers this action in the track context menu. This addon makes it available directly on the row.

Click the queue icon or focus it and press Enter/Space. The selected track is inserted after the currently playing track. Selecting several tracks follows Yandex Music's native behavior: the most recently selected track goes next.

The button stays visible and uses Yandex Music's built-in **Play next** icon, a 20px glyph inside a 40px control. Its colors, hover, and keyboard-focus ring follow the native track controls. It is disabled for unavailable tracks or disabled Like controls. Track cards without an inline Like button are left alone.

## Install

1. Open PulseSync.
2. Drag `PlayNextInline-1.0.1.pext` into its window and import it.
3. Enable **PlayNextInline** in your addons library. PulseSync may reload Yandex Music when enabling a script addon.

If dropping the file does nothing on macOS, open Terminal, type `open -a PulseSync ` (including the trailing space), drag the `.pext` file into Terminal to insert its path, and press Enter. This uses PulseSync's native file-opening handler. Then open the addons library and enable **PlayNextInline**.

Keep PulseSync running alongside the modified Yandex Music client. To remove the addon, disable or delete it in PulseSync.

## Compatibility

Requires a PulseSync mod exposing `window.pulsesyncApi.playerInstance.injectNext`. Integration was checked against installed PulseSync **2.16.0-beta** and mod **1.33.2**, whose bundled Yandex Music frontend reports **5.113.2** (host compatibility version **5.112.0**).

The script uses Yandex Music's native queue operation and references the client's own `/icons/sprite.svg#playNext_xxs` icon. It makes no external network requests and has no runtime dependencies. DOM selectors, icon names, and React's private DOM props can change with client updates; a track-link fallback is included. If the track or queue cannot be found, it displays an error and leaves the queue alone.

Browser tests use real React track-row fixtures and a simulated queue. Actual playback in an authenticated desktop session still needs a manual check: start a track, click this button for another track, and confirm the selected track is immediately next in the queue.
