# QueueButtons 1.1.1

Code cleanup and development checks. The two queue buttons work the same way as before.

For the PulseSync publication form:

```text
- Упрощена структура кода: поиск трека, управление кнопками и обработка изменений страницы разделены на небольшие функции.
- Иконки создаются через DOM API без вставки HTML-строк.
- Добавлены Biome, единое форматирование и автоматические проверки в GitHub Actions.
- Дополнены проверки отключения аддона во время добавления трека в очередь.
- Поведение кнопок «Играть следующим» и «Добавить в конец очереди» не изменилось.
```

AI was used during development: **Yes**.

Automated tests use a simulated queue. Test both buttons in the desktop client before publishing.
