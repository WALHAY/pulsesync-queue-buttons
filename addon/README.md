# QueueButtons

Add songs to your Yandex Music queue straight from the track list. QueueButtons adds two buttons to search results, albums, and Liked tracks:

- **Play next / Играть следующим** — puts the song right after the current one.
- **Add to end of queue / Добавить в конец очереди** — puts it after everything already queued.

You'll find both to the left of the heart, with Play next closest to it. They use the client's own icons and colors. Your current song keeps playing when you click them.

## Install

Open PulseSync, drag in `QueueButtons-1.1.0.pext`, then enable **QueueButtons** in the addons library. Yandex Music may reload.

If dragging does nothing on macOS, open Terminal and type `open -a PulseSync ` with a space at the end. Drag the `.pext` file into Terminal to add its path, then press Enter.

This is an update to **PlayNextInline**. Import it over the old version; there is no need to install a second addon.

## Good to know

Keep PulseSync running alongside the modified Yandex Music client. Hover over a button for its label, or use Tab and Enter/Space to activate it.

Songs added to the end stay in the order you picked them. With Play next, the last song you picked goes next. Unavailable tracks have disabled buttons.

The addon uses the same queue actions as Yandex Music's track menu. If it can't add a song, it shows a message so you can try the menu instead. Client updates can affect compatibility.

To remove the buttons, disable QueueButtons in PulseSync.
