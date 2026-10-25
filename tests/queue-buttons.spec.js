import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';

const addon = fileURLToPath(new URL('../addon/script.js', import.meta.url));
const css = fileURLToPath(new URL('../addon/style.css', import.meta.url));
const fixture = await build({
  entryPoints: [fileURLToPath(new URL('./fixture.jsx', import.meta.url))],
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"development"' },
});
const next = '[data-test-id="PULSESYNC_PLAY_NEXT_BUTTON"]';
const last = '[data-test-id="PULSESYNC_ADD_TO_QUEUE_BUTTON"]';
const queueButtons = `${last}, ${next}`;
const like = '[data-test-id="LIKE_BUTTON"]';

test.beforeEach(async ({ page }) => {
  // A same-origin sprite fixture exercises external SVG <use> loading without
  // redistributing the client's artwork or depending on a real music account.
  await page.route('https://music.yandex.ru/icons/sprite.svg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<symbol id="playNext_xxs" viewBox="0 0 20 20"><path fill="currentColor" d="M3 10h14v2H3zM3 15h14v2H3z"/></symbol>' +
      '<symbol id="playLast_xxs" viewBox="0 0 20 20"><path fill="currentColor" d="M3 3h14v2H3zM3 8h14v2H3z"/></symbol></svg>',
  }));
  await page.route('https://music.yandex.ru/', route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="en"><head><style>
    body { margin: 24px; background: #151515; color: #eee; font: 16px sans-serif; }
    section { margin-top: 24px; }
    .HorizontalCardContainer_root__native { display: flex; align-items: center; width: 100%; height: 56px; overflow: hidden; }
    .cover { flex: 0 0 40px; }
    a { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: inherit; }
    .CommonControlsBar_root__native { display: flex; align-items: center; gap: 16px; height: 100%; --text-enabled-color: #a6a6a6; --text-hovered-color: #fff; }
    .CommonControlsBar_root__native > button { width: 40px; height: 40px; flex-shrink: 0; }
    button[data-test-id="LIKE_BUTTON"], button[data-test-id="TRACK_CONTEXT_MENU_BUTTON"] { border: 0; border-radius: 50%; background: transparent; color: #a6a6a6; font-size: 20px; }
  </style></head><body><div id="root"></div></body></html>`,
  }));
  await page.goto('https://music.yandex.ru/');
  await page.addScriptTag({ content: fixture.outputFiles[0].text });
  await page.addStyleTag({ path: css });
  await page.addScriptTag({ path: addon });
});

test('places both buttons left of Like, keeping Play next closest, on all three surfaces', async ({ page }) => {
  await expect(page.locator(next)).toHaveCount(3);
  await expect(page.locator(last)).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const row = page.locator(`[data-slot="${i}"]`);
    const button = row.locator(next);
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName('Play next');
    await expect(row.locator(last)).toBeVisible();
    await expect(row.locator(last)).toHaveAccessibleName('Add to end of queue');
    expect(await row.locator(last).evaluate(node => node.nextElementSibling?.dataset.testId)).toBe('PULSESYNC_PLAY_NEXT_BUTTON');
    expect(await button.evaluate(node => node.nextElementSibling?.dataset.testId)).toBe('LIKE_BUTTON');
    const [end, left, right] = await Promise.all([row.locator(last).boundingBox(), button.boundingBox(), row.locator(like).boundingBox()]);
    expect(end.x + end.width).toBeLessThanOrEqual(left.x);
    expect(end.y).toBe(left.y);
    expect(left.x + left.width).toBeLessThanOrEqual(right.x);
    expect(Math.abs(left.y + left.height / 2 - right.y - right.height / 2)).toBeLessThan(1);
  }
  await expect(page.locator('[data-test-id="ALBUM_CARD"]').locator(queueButtons)).toHaveCount(0);
  await expect(page.locator('section').locator(queueButtons)).toHaveCount(6);
});

test('renders the client sprite and follows track-control colors and focus styling', async ({ page }) => {
  const button = page.locator(next).first();
  const icon = button.locator('svg');
  await expect.poll(() => icon.locator('use').evaluate(node => node.getBBox().width)).toBeGreaterThan(0);
  await expect.poll(() => page.locator(last).first().locator('use').evaluate(node => node.getBBox().width)).toBeGreaterThan(0);
  await expect(icon).toHaveCSS('width', '20px');
  await expect(button).toHaveCSS('width', '40px');
  await expect(button).toHaveCSS('color', 'rgb(166, 166, 166)');
  await button.hover();
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await button.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(button).toBeFocused();
  await expect(button).not.toHaveCSS('box-shadow', 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(button).toHaveCSS('transition-duration', '0s');
});

test('queues the chosen track after the current track without playback, Like, or row events', async ({ page }) => {
  await page.locator('[data-slot="1"]').locator(next).click();
  expect(await page.evaluate(() => window.queue)).toEqual(['currently-playing', '22:202', 'previously-next']);
  expect(await page.evaluate(() => window.queueCalls)).toEqual([
    { entitiesData: [{ type: 'unloaded', meta: { id: '22:202' } }] },
  ]);
  expect(await page.evaluate(() => [window.playCalls, window.rowEvents])).toEqual([0, []]);
  await expect(page.getByRole('status')).toHaveText('Next in queue: Album track');
});

test('Enter and Space activate the button without triggering the row', async ({ page }) => {
  const buttons = page.locator(next);
  await buttons.nth(0).focus();
  await page.keyboard.press('Enter');
  await buttons.nth(2).focus();
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.queue)).toEqual(['currently-playing', '33:303', '11:101', 'previously-next']);
  expect(await page.evaluate(() => window.rowEvents)).toEqual([]);
});

for (const selector of [next, last]) {
  test(`a double-click inserts only once for ${selector}`, async ({ page }) => {
    await page.locator(selector).first().dblclick();
    expect(await page.evaluate(() => window.queueCalls.length + window.appendCalls.length)).toBe(1);
    expect(await page.evaluate(() => window.rowEvents)).toEqual([]);
  });
}

test('adds tracks to the end in click order without changing playback or earlier queue entries', async ({ page }) => {
  await page.locator(last).nth(1).click();
  await page.locator(last).nth(2).click();
  expect(await page.evaluate(() => window.queue)).toEqual(['currently-playing', 'previously-next', '22:202', '33:303']);
  expect(await page.evaluate(() => window.appendCalls)).toEqual([
    { entitiesData: [{ type: 'unloaded', meta: { id: '22:202' } }] },
    { entitiesData: [{ type: 'unloaded', meta: { id: '33:303' } }] },
  ]);
  expect(await page.evaluate(() => [window.playCalls, window.rowEvents, window.queueCalls])).toEqual([0, [], []]);
  await expect(page.getByRole('status')).toHaveText('Added to end of queue: Liked track');
});

test('end-of-queue buttons work with Enter and Space alongside Play next', async ({ page }) => {
  await page.locator(last).nth(0).focus();
  await page.keyboard.press('Enter');
  await page.locator(last).nth(1).focus();
  await page.keyboard.press('Space');
  await page.locator(next).nth(2).click();
  expect(await page.evaluate(() => window.queue)).toEqual(['currently-playing', '33:303', 'previously-next', '11:101', '22:202']);
  expect(await page.evaluate(() => window.rowEvents)).toEqual([]);
});

test('a recycled React row queues its new track, including the album context', async ({ page }) => {
  const button = page.locator(next).first();
  await button.evaluate(node => { window.originalButton = node; });
  await page.evaluate(() => window.fixture.render([
    { id: '99', albumId: '909', entityId: '99:909', title: 'Recycled track' },
  ]));
  await expect(page.locator(next)).toHaveCount(1);
  expect(await button.evaluate(node => node === window.originalButton)).toBe(true);
  await button.click();
  expect(await page.evaluate(() => window.queue[1])).toBe('99:909');
  await page.locator(last).click();
  expect(await page.evaluate(() => window.queue.at(-1))).toBe('99:909');
});

test('handles appended rows, replaced Like buttons, and removed Like buttons', async ({ page }) => {
  await page.evaluate(() => window.fixture.render(Array.from({ length: 30 }, (_, i) => ({
    id: String(i + 1), albumId: '800', title: `Track ${i}`, generation: 1,
  }))));
  await expect(page.locator(next)).toHaveCount(30);
  await expect(page.locator(last)).toHaveCount(30);
  await page.locator(next).last().click();
  expect(await page.evaluate(() => window.queue[1])).toBe('30:800');
  await page.evaluate(() => window.fixture.render([
    { id: '1', albumId: '800', title: 'Track 0', noLike: true },
  ]));
  await expect(page.locator(queueButtons)).toHaveCount(0);
});

test('unavailable tracks and signed-out controls remain disabled', async ({ page }) => {
  await page.evaluate(() => window.fixture.render([
    { id: '1', title: 'Unavailable', isAvailable: false },
    { id: '2', title: 'Signed out', signedOut: true },
  ]));
  await expect(page.locator(next).nth(0)).toBeDisabled();
  await expect(page.locator(next).nth(1)).toBeDisabled();
  await expect(page.locator(last).nth(0)).toBeDisabled();
  await expect(page.locator(last).nth(1)).toBeDisabled();
  await page.locator(next).nth(0).dispatchEvent('click');
  await page.locator(last).nth(0).dispatchEvent('click');
  expect(await page.evaluate(() => window.queueCalls)).toEqual([]);
  expect(await page.evaluate(() => window.appendCalls)).toEqual([]);
  await page.evaluate(() => window.fixture.render([{ id: '1', title: 'Available again' }]));
  await expect(page.locator(next)).toBeEnabled();
  await expect(page.locator(last)).toBeEnabled();
});

test('uses the row track link when React props are unavailable', async ({ page }) => {
  await page.locator('[data-slot="1"]').evaluate(row => {
    for (const node of [row, ...row.querySelectorAll('*')]) {
      for (const key of Object.keys(node)) if (key.startsWith('__reactProps$')) delete node[key];
    }
  });
  await page.locator('[data-slot="1"]').locator(next).click();
  expect(await page.evaluate(() => window.queue[1])).toBe('22:202');
  await page.locator('[data-slot="1"]').locator(last).click();
  expect(await page.evaluate(() => window.queue.at(-1))).toBe('22:202');
});

test('does not guess the track when both props and track links are absent', async ({ page }) => {
  await page.locator('[data-slot="1"]').evaluate(row => {
    for (const node of [row, ...row.querySelectorAll('*')]) {
      for (const key of Object.keys(node)) if (key.startsWith('__reactProps$')) delete node[key];
    }
    row.querySelector('a').setAttribute('href', '/album/202');
  });
  await page.locator('[data-slot="1"]').locator(next).click();
  expect(await page.evaluate(() => window.queueCalls)).toEqual([]);
  await expect(page.getByRole('status')).toContainText('Could not add this track');
  await page.locator('[data-slot="1"]').locator(last).click();
  expect(await page.evaluate(() => window.appendCalls)).toEqual([]);
});

test('missing queue API reports failure and works when the player becomes ready', async ({ page }) => {
  await page.evaluate(() => { window.savedApi = window.pulsesyncApi; delete window.pulsesyncApi; });
  const button = page.locator(next).first();
  await button.click();
  await expect(page.getByRole('status')).toContainText('Could not add this track');
  expect(await page.evaluate(() => window.queueCalls)).toEqual([]);
  await page.evaluate(() => { window.pulsesyncApi = window.savedApi; });
  await expect(button).not.toHaveAttribute('aria-busy', 'true');
  await button.click();
  await expect(page.getByRole('status')).toContainText('Next in queue');
});

for (const [selector, method] of [[next, 'injectNext'], [last, 'injectLast']]) {
  test(`${method} rejection does not report success or leave the button busy`, async ({ page }) => {
    await page.evaluate(method => {
      window.pulsesyncApi.playerInstance[method] = () => Promise.reject(new Error('queue failed'));
    }, method);
    const button = page.locator(selector).first();
    await button.click();
    await expect(page.getByRole('status')).toContainText('Could not add this track');
    await expect(button).not.toHaveAttribute('aria-busy', 'true');
  });
}

test('a missing append API cannot insert at the wrong position, and Play next still works', async ({ page }) => {
  await page.evaluate(() => { delete window.pulsesyncApi.playerInstance.injectLast; });
  await page.locator(last).first().click();
  await expect(page.getByRole('status')).toContainText('Could not add this track');
  expect(await page.evaluate(() => window.queue)).toEqual(['currently-playing', 'previously-next']);
  await page.locator(next).first().click();
  expect(await page.evaluate(() => window.queue[1])).toBe('11:101');
});

test('upgrades the previous PlayNextInline script without leaving duplicate controls', async ({ page }) => {
  const archive = unzipSync(await readFile(new URL('../dist/PlayNextInline-1.0.1.pext', import.meta.url)));
  await page.evaluate(() => window.__pulseSyncQueueButtons.dispose());
  await page.addScriptTag({ content: strFromU8(archive['script.js']) });
  await expect(page.locator(next)).toHaveCount(3);
  await page.addScriptTag({ path: addon });
  await expect(page.locator(queueButtons)).toHaveCount(6);
  expect(await page.evaluate(() => window.__pulseSyncPlayNextInline)).toBeUndefined();
  await page.locator(next).first().click();
  expect(await page.evaluate(() => window.queueCalls.length)).toBe(1);
});

test('reloading and disabling the addon remove old buttons, observers, and notifications', async ({ page }) => {
  await page.addScriptTag({ path: addon });
  await expect(page.locator(queueButtons)).toHaveCount(6);
  await page.locator(next).first().click();
  expect(await page.evaluate(() => window.queueCalls.length)).toBe(1);
  await page.locator('script').last().evaluate(node => node.remove());
  await expect(page.locator(queueButtons)).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.evaluate(() => window.fixture.render([{ id: '77', title: 'After cleanup' }]));
  await expect(page.locator(queueButtons)).toHaveCount(0);
});

test('localizes labels and renders track titles as text', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.lang = 'ru';
    window.fixture.render([{ id: '7', title: '<img src=x onerror=alert(1)>' }]);
  });
  await expect(page.locator(next)).toHaveAccessibleName('Играть следующим');
  await expect(page.locator(last)).toHaveAccessibleName('Добавить в конец очереди');
  await page.locator(next).click();
  await expect(page.getByRole('status')).toHaveText('Следующим в очереди: <img src=x onerror=alert(1)>');
  await expect(page.getByRole('status').locator('img')).toHaveCount(0);
  await page.locator(last).click();
  await expect(page.getByRole('status')).toHaveText('Добавлено в конец очереди: <img src=x onerror=alert(1)>');
  await expect(page.getByRole('status').locator('img')).toHaveCount(0);
});

test('keeps both queue buttons and Like in one line at a narrow desktop window width', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 750 });
  const row = page.locator('[data-slot="0"]');
  const [endBox, buttonBox, likeBox, rowBox] = await Promise.all([
    row.locator(last).boundingBox(), row.locator(next).boundingBox(), row.locator(like).boundingBox(), row.boundingBox(),
  ]);
  expect(endBox.x).toBeGreaterThanOrEqual(rowBox.x);
  expect(endBox.x + endBox.width).toBeLessThanOrEqual(buttonBox.x);
  expect(endBox.y).toBe(buttonBox.y);
  expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(likeBox.x);
  expect(buttonBox.y).toBe(likeBox.y);
  await page.screenshot({ path: 'test-results/queue-buttons-narrow.png' });
});
