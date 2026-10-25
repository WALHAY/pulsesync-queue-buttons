# Publishing QueueButtons

Run `npm ci` and `npm run build` from the project folder to create `dist/QueueButtons-1.1.2.pext`. Built packages are ignored by Git. Nothing has been submitted to the catalog yet.

This guide follows the [PulseSync addon publication rules](https://pulsesync.dev/wiki/main/app/addons/publishing), revision **20 April 2026**, using the text supplied by the owner. Cloudflare blocked direct access during the review. The extra notes about the publication form come from the [official PulseSync client source](https://github.com/PulseSync-LLC/PulseSync-client/blob/main/src/renderer/widgets/modalContainer/modals/ExtensionPublicationModal.tsx).

## What you still need to do

1. **Test the addon in Yandex Music.** Import the package, enable QueueButtons, and try both buttons in search results, an album, and Liked tracks. Play next should insert right after the current song; Add to end should append after the existing queue. Check that playback keeps going, Like still works, and scrolling does not add duplicate buttons. Automated tests cover queue behavior with a simulated queue. The rules require a working addon, so verify it in the desktop client before submitting.
2. **Push the source to GitHub.** The public repository already exists at [WALHAY/pulsesync-queue-buttons](https://github.com/WALHAY/pulsesync-queue-buttons), but it was empty when checked. From this project, run `git push -u origin main`. Verify that the files and current version are visible before submitting. The rules require a link to this addon's actual source repository.
3. **Check the author and rights.** The metadata author is `walhay`. It should match your signed-in PulseSync username or nickname; the client compares these case-insensitively. You also need the rights to publish the code, name, icon, and any other materials you include (rules 1, 4, and 8). No open-source license file is explicitly required by these rules, and no new license has been chosen for you.
4. **Prepare an honest listing.** Use the current name, description, and version from `addon/metadata.json`, the GitHub link above, and the [1.1.2 changelog](release-notes-1.1.2.md). Set **AI was used during development** to **Yes**. If you upload a screenshot, capture it in the actual Yandex Music client. `docs/queue-buttons-preview.png` is a layout illustration made with test rows, so do not submit it as a screenshot of the running addon.
5. **Submit in PulseSync.** Open QueueButtons → **Publication / Публикация**, fill in the fields, read the linked rules, accept them if you agree, and submit for review.

On macOS, this imports the current package when dragging the file does nothing:

```sh
open -a PulseSync dist/QueueButtons-1.1.2.pext
```

If Publication is missing despite a matching author and an active sign-in, the client may not have publishing enabled for your account.

## What is already prepared

| Requirement                               | QueueButtons                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| Name, description, version, author        | Included in `metadata.json`                                                                  |
| Referenced images included in the archive | The custom `icon.svg` is packaged; no banner is declared                                     |
| Changelog for this version                | Ready in the release notes                                                                   |
| AI disclosure                             | Yes; also noted in the release notes                                                         |
| Readable code                             | Plain JavaScript; no obfuscation or remote code loading                                      |
| Data access limited to the feature        | Reads track information and uses the native queue; no token, OAuth, or secret-storage access |
| External data transfers                   | No calls to outside services                                                                 |
| Subscription restrictions                 | The addon does not modify PulseSync/Boosty subscription checks or hide paid-feature UI       |
| Build and development checks              | Biome, browser tests, and archive verification are configured                                |

The toolbar buttons reference icons already installed in Yandex Music. Their raw artwork is not copied into the addon archive. This is different from claiming ownership of those icons: make sure you have the necessary rights for any artwork you add to the listing.

The rules recommend **PulseSync-ExampleAddon**, but explicitly say it is **optional**. You do not need to migrate this addon to the official template just to submit it.

## After submission

First publications and updates are reviewed. Moderators can reject an addon that breaks the rules or remove it later if problems are found. After a rejection, fix the feedback and wait **at least three days** before resubmitting.

The author is responsible for the addon, the legality of its materials, the accuracy of the listing, and its safety. Avoid misleading screenshots, claims that it is an official PulseSync product, or anything that bypasses or disguises subscription restrictions. The rules also apply to older catalog entries, and PulseSync may require updates to bring them into compliance.
