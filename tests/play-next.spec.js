import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

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
const like = '[data-test-id="LIKE_BUTTON"]';

test.beforeEach(async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="en"><head><base href="https://music.yandex.ru/"><style>
    body { margin: 24px; background: #151515; color: #eee; font: 16px sans-serif; }
    section { margin-top: 24px; }
    .HorizontalCardContainer_root__native { display: flex; align-items: center; width: 100%; height: 56px; overflow: hidden; }
    .cover { flex: 0 0 40px; }
    a { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: inherit; }
    .CommonControlsBar_root__native { display: flex; align-items: center; gap: 16px; height: 100%; }
    .CommonControlsBar_root__native > button { width: 40px; height: 40px; flex-shrink: 0; }
  </style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: fixture.outputFiles[0].text });
  await page.addStyleTag({ path: css });
  await page.addScriptTag({ path: addon });
});

test('places one visible button immediately left of Like on all three surfaces', async ({ page }) => {
  await expect(page.locator(next)).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const row = page.locator(`[data-slot="${i}"]`);
    const button = row.locator(next);
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName('Play next');
    expect(await button.evaluate(node => node.nextElementSibling?.dataset.testId)).toBe('LIKE_BUTTON');
    const [left, right] = await Promise.all([button.boundingBox(), row.locator(like).boundingBox()]);
    expect(left.x + left.width).toBeLessThanOrEqual(right.x);
    expect(Math.abs(left.y + left.height / 2 - right.y - right.height / 2)).toBeLessThan(1);
  }
  await expect(page.locator('[data-test-id="ALBUM_CARD"]').locator(next)).toHaveCount(0);
  await expect(page.locator('section').locator(next)).toHaveCount(3);
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

test('a double-click inserts only once', async ({ page }) => {
  await page.locator(next).first().dblclick();
  expect(await page.evaluate(() => window.queueCalls.length)).toBe(1);
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
});

test('handles appended rows, replaced Like buttons, and removed Like buttons', async ({ page }) => {
  await page.evaluate(() => window.fixture.render(Array.from({ length: 30 }, (_, i) => ({
    id: String(i + 1), albumId: '800', title: `Track ${i}`, generation: 1,
  }))));
  await expect(page.locator(next)).toHaveCount(30);
  await page.locator(next).last().click();
  expect(await page.evaluate(() => window.queue[1])).toBe('30:800');
  await page.evaluate(() => window.fixture.render([
    { id: '1', albumId: '800', title: 'Track 0', noLike: true },
  ]));
  await expect(page.locator(next)).toHaveCount(0);
});

test('unavailable tracks and signed-out controls remain disabled', async ({ page }) => {
  await page.evaluate(() => window.fixture.render([
    { id: '1', title: 'Unavailable', isAvailable: false },
    { id: '2', title: 'Signed out', signedOut: true },
  ]));
  await expect(page.locator(next).nth(0)).toBeDisabled();
  await expect(page.locator(next).nth(1)).toBeDisabled();
  await page.locator(next).nth(0).dispatchEvent('click');
  expect(await page.evaluate(() => window.queueCalls)).toEqual([]);
  await page.evaluate(() => window.fixture.render([{ id: '1', title: 'Available again' }]));
  await expect(page.locator(next)).toBeEnabled();
});

test('uses the row track link when React props are unavailable', async ({ page }) => {
  await page.locator('[data-slot="1"]').evaluate(row => {
    for (const node of [row, ...row.querySelectorAll('*')]) {
      for (const key of Object.keys(node)) if (key.startsWith('__reactProps$')) delete node[key];
    }
  });
  await page.locator('[data-slot="1"]').locator(next).click();
  expect(await page.evaluate(() => window.queue[1])).toBe('22:202');
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

test('queue rejection does not report success or leave the button busy', async ({ page }) => {
  await page.evaluate(() => {
    window.pulsesyncApi.playerInstance.injectNext = () => Promise.reject(new Error('queue failed'));
  });
  const button = page.locator(next).first();
  await button.click();
  await expect(page.getByRole('status')).toContainText('Could not add this track');
  await expect(button).not.toHaveAttribute('aria-busy', 'true');
});

test('reloading and disabling the addon remove old buttons, observers, and notifications', async ({ page }) => {
  await page.addScriptTag({ path: addon });
  await expect(page.locator(next)).toHaveCount(3);
  await page.locator(next).first().click();
  expect(await page.evaluate(() => window.queueCalls.length)).toBe(1);
  await page.locator('script').last().evaluate(node => node.remove());
  await expect(page.locator(next)).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.evaluate(() => window.fixture.render([{ id: '77', title: 'After cleanup' }]));
  await expect(page.locator(next)).toHaveCount(0);
});

test('localizes labels and renders track titles as text', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.lang = 'ru';
    window.fixture.render([{ id: '7', title: '<img src=x onerror=alert(1)>' }]);
  });
  await expect(page.locator(next)).toHaveAccessibleName('Играть следующим');
  await page.locator(next).click();
  await expect(page.getByRole('status')).toHaveText('Следующим в очереди: <img src=x onerror=alert(1)>');
  await expect(page.getByRole('status').locator('img')).toHaveCount(0);
});

test('keeps both controls in one line at a narrow desktop window width', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 750 });
  const row = page.locator('[data-slot="0"]');
  const [buttonBox, likeBox, rowBox] = await Promise.all([
    row.locator(next).boundingBox(), row.locator(like).boundingBox(), row.boundingBox(),
  ]);
  expect(buttonBox.x).toBeGreaterThanOrEqual(rowBox.x);
  expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(likeBox.x);
  expect(buttonBox.y).toBe(likeBox.y);
  await page.screenshot({ path: 'test-results/play-next-narrow.png' });
});
