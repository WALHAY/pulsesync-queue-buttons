# QueueButtons 1.1.2

Fixes Add to end in My Vibe and swaps the buttons to **Play next → Add to end → Like**.

For the PulseSync publication form:

```text
- Исправлено добавление в конец очереди в «Моей волне»: теперь трек попадает после добавленных вручную песен, перед рекомендациями.
- В нативные действия injectLast и injectNext передаётся контекст источника трека, необходимый для корректной работы очереди.
- Кнопки поменяны местами: «Играть следующим» → «Добавить в конец очереди» → лайк.
```

AI was used during development: **Yes**.

Validated with 24 browser tests, Biome, archive verification, and the installed Yandex Music 5.124.1 queue hook. Browser tests simulate playback; test the update in the desktop client before publishing.
