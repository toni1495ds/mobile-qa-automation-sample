// API tests config, starts the mock server if BASE_URL is not set

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './api/tests',
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // mock by default, set BASE_URL for a real env
    baseURL: process.env.BASE_URL ?? 'http://localhost:3333',
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run mock',
        url: 'http://localhost:3333/health',
        reuseExistingServer: true,
      },
});
