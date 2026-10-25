# Publishing PlayNextInline

The prepared release is [`PlayNextInline-1.0.1.pext`](../dist/PlayNextInline-1.0.1.pext). Publication is deferred at the owner's request. Nothing has been submitted to the PulseSync catalog.

## Source repository

Local Git commits are ready. The configured remote is `git@github.com:WALHAY/pulsesync-play-next.git`, but GitHub did not resolve that repository during preparation. Create the repository and publish the source before submitting to PulseSync:

```sh
gh repo create WALHAY/pulsesync-play-next --public --description "Inline Play next button for PulseSync and Yandex Music"
git push -u origin main
```

Then use `https://github.com/WALHAY/pulsesync-play-next` in the publication form. If the repository has already been created by then, only the push is needed.

## Submit in PulseSync

1. Sign in to PulseSync. No saved session was available during preparation.
2. Import the `.pext` file and open **PlayNextInline** in the addons library.
3. Check that the addon author, currently `walhay`, matches your PulseSync username or nickname. The client compares these case-insensitively before showing publication controls. If you change the author in this repository, rebuild with `npm run build` and reimport.
4. Open **Publication / Публикация**, supply the GitHub link, and paste the changelog from [release notes](release-notes-1.0.1.md).
5. Set **AI was used during development / При разработке использовался ИИ** to **Yes**.
6. Read the [official publication rules](https://pulsesync.dev/wiki/main/app/addons/publishing) and accept them if you agree. The rules page returned HTTP 403 during preparation; its terms have not been reviewed or accepted here.
7. Submit for moderation. A successful upload means **sent for review**; the addon appears publicly only after PulseSync approves it.

The installed client gates submission on its `ClientExtensionStorePublishing` account feature. If Publication is unavailable after signing in with a matching author, publishing access must be enabled for that account by PulseSync.

Before submitting, check playback in the desktop app: start a track, use Play next on search, album, and liked-track rows, and confirm the selected track is directly after the current track in the queue.

## Preparation evidence

The installed PulseSync 2.16.0-beta client requires a GitHub URL, a changelog, a rules acknowledgement, and an AI-development declaration. It packages the addon and submits it to `/extensions/create`; updates use `/extensions/{id}/update`. Publication rules and availability may change, so follow the current UI when submitting.

The addon references Yandex Music's installed icon sprite; native icon artwork is not copied into the addon package.
