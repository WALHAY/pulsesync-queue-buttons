import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  use: { browserName: 'chromium', viewport: { width: 1100, height: 750 } },
  reporter: 'list',
});
