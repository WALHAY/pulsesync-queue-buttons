# Existing addon check

These notes cover the original PlayNextInline release. The addon is now called **QueueButtons** and also includes Add to end of queue.

Checked October 25, 2026 for a button that inserts a selected track immediately after the current track, immediately to the left of Like on the same row in search, albums, and liked tracks.

**Result:** no exact match found in the accessible sources below. Complete the local PlayNextInline addon using the client's existing native queue operation. This finding does not exclude store-only or Discord-distributed addons.

## Sources checked

| Source | Relevant behavior | Match? |
| --- | --- | --- |
| Installed Default theme and FckCensor 1.4.3 | Default styling and censored-track replacement | No inline Play next control |
| [BetterPlayer](https://github.com/PulseSync-LLC/BetterPlayer-addon) | Fullscreen player customization and opening the queue | No enqueue-next control on track rows |
| [Liked Sort](https://github.com/xenkalinka/liked-sort-addon) | Reorders liked tracks by updating like timestamps | Changes collection order, not the playback queue |
| [CopyTrackName](https://github.com/mak7im01/CopyTrackName) | Adds track information copy buttons near titles | Different action and placement |
| [CoverDownloader](https://github.com/mak7im01/CoverDownloader) and [CoverDownloaderInline](https://github.com/mak7im01/CoverDownloaderInline) | Adds cover download buttons | No queue operation |
| [WebSocket Controls](https://github.com/WolfySoCute/pulsesync-controls-addon) | Remote skip, pause, and volume controls | Does not queue a selected track next |
| [HokenSync](https://github.com/flocsyc/HokenSync) | Lyrics search and editing | Reads current track information; no inline Play next action |
| [Player Controls Grid](https://github.com/mak7im01/Player-Controls-Grid) | Rearranges player controls and queue visibility | Does not add an action to track rows |
| [Yandex Music Download Addon](https://github.com/kesevone/yandex-music-download-addon) | Windows download addon with a persistent download queue | Download queue, not playback queue |

Read the listed READMEs and scripts, except the download addon where the README was sufficient. Also enumerated [official PulseSync repositories](https://github.com/orgs/PulseSync-LLC/repositories) and searched GitHub repository metadata/READMEs for PulseSync/Yandex Music with `play next`, `PlayNext`, `next`, `queue`, `очередь`, and `следующим`. Selected scripts were searched for `injectNext`, `playNext`, related English/Russian terms, and button insertion code.

## Coverage limits

- The [official website](https://pulsesync.dev) returned HTTP 403.
- The catalog query and endpoint were identified from the official client's [getStoreAddons query](https://github.com/PulseSync-LLC/PulseSync-client/blob/main/src/renderer/entities/addon/api/getStoreAddons.query.ts) and [app configuration](https://github.com/PulseSync-LLC/PulseSync-client/blob/main/src/common/appConfig.ts). Read-only catalog requests returned `FORBIDDEN` anonymously and through the existing PulseSync session. No account settings changed.
- GitHub global code search and general web search were unavailable; two final README searches reached GitHub's rate limit. An npm search timed out during TLS negotiation.

## Local integration evidence

Inspected the installed PulseSync 2.16.0-beta importer and the modified Yandex Music 5.113.2 frontend. Checked the extracted integration sources against the installed application archives.

- PulseSync imports ZIP archives with a `.pext` extension and `metadata.json` at the root. Script and CSS filenames come from the metadata.
- Search and common track rows expose the native `LIKE_BUTTON` control. PlayNextInline inserts its button immediately before that control.
- Yandex Music's native track menu calls `playerInstance.injectNext` with an unloaded entity whose ID includes the album context. PlayNextInline uses that operation rather than starting playback.
- The 14 Playwright tests passed with real React fixtures and a simulated queue. Packaging verifies decompressed files against the source files. Authenticated desktop playback and third-party themes have not been tested.
