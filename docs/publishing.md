# Publishing QueueButtons

The current package is [QueueButtons-1.1.0.pext](../dist/QueueButtons-1.1.0.pext). Nothing has been submitted to the catalog yet.

## Put the source on GitHub

PulseSync asks for a GitHub link when you submit an addon. This project's remote points to `WALHAY/pulsesync-play-next`.

If that repository doesn't exist yet, create it:

```sh
gh repo create WALHAY/pulsesync-play-next --public --description "QueueButtons for PulseSync and Yandex Music"
```

Then push your commits:

```sh
git push -u origin main
```

Use `https://github.com/WALHAY/pulsesync-play-next` as the source link.

## Submit the addon

1. Sign in to PulseSync and import the package. On macOS, `open -a PulseSync dist/QueueButtons-1.1.0.pext` works if dropping the file doesn't.
2. Enable **QueueButtons** and try both buttons in search results, an album, and Liked tracks. Play next should insert after the current song; Add to end should append after the existing queue. The current song should keep playing.
3. Open the addon's **Publication / Публикация** page. Its author, currently `walhay`, must match your PulseSync username or nickname. If you edit the author in this project's metadata, rebuild and import the new package.
4. Enter the GitHub link and paste the changelog from the [1.1.0 release notes](release-notes-1.1.0.md).
5. Check **AI was used during development / При разработке использовался ИИ**.
6. Read the [publication rules](https://pulsesync.dev/wiki/main/app/addons/publishing), accept them if you agree, and submit.

A successful submission goes to moderator review. It appears in the catalog after approval.

If Publication is missing even though the author matches your signed-in account, PulseSync may need to enable publishing access for that account.
