# Changelog

## 1.1.5

- Кнопки очереди появляются при наведении на трек или фокусе с клавиатуры, как кнопка удаления из плейлиста.
- README переведены на русский и сокращены.
- Иллюстрации с вымышленными треками убраны из описания и пакета аддона.

## 1.1.4

- Added GitHub, download, and issue links to the addon page.
- Added illustrations of the button layout and the difference between the two queue actions.
- Bundled the images with the addon so they load locally in PulseSync.

## 1.1.3

- Brought the queue buttons closer together, with a little extra space before Like.
- Kept the existing icon sizes and click areas.

## 1.1.2

- Fixed Add to end in My Vibe by passing the track's source context to the native queue action. Manual additions now go before recommendations.
- Changed the button order to **Play next → Add to end → Like**.
- Rewrote the READMEs with clearer descriptions and installation instructions.
- Removed generated packages from Git and made upgrade tests independent of built archives.

## 1.1.1

- Simplified track lookup, button updates, and cleanup.
- Created icons through DOM methods instead of HTML strings.
- Added Biome formatting and lint checks, EditorConfig, and GitHub Actions.
- Added regression coverage for disabling the addon while a queue action is pending.

## 1.1.0

- Renamed the addon to **QueueButtons**, keeping the same addon ID for upgrades.
- Added **Add to end of queue** alongside Play next in search results, albums, and Liked tracks.
- Updated the addon icon and README.

## 1.0.1

- Switched to Yandex Music's native Play next icon.
- Matched the client's colors, hover effects, keyboard focus, and disabled styling.
- Respected reduced-motion settings.
- Documented the macOS import command for cases where drag-and-drop does nothing.

## 1.0.0

- First version of **PlayNextInline**: a Play next button to the left of Like in track lists.
- Used the native queue action to add a song after the current track.
- Supported keyboard controls, English and Russian labels, dynamically loaded tracks, and recycled rows.
- Removed buttons and event listeners when the addon was disabled.
