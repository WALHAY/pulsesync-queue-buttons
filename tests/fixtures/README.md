# Test fixtures

`play-next-1.0.1.js` is the unchanged script from PlayNextInline 1.0.1, extracted from its original package. The upgrade test loads it before QueueButtons to verify that the old addon is cleaned up correctly.

This historical source is excluded from formatting and linting so it stays identical to the released version. It lets the tests run without storing a built `.pext` archive in Git.

`page.html`, `page.css`, and `sprite.svg` provide the simulated track-list page. The sprite contains simple test shapes, not copies of Yandex Music's artwork.
