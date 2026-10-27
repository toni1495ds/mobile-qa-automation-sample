import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './api/tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // runs against the mock by default, set BASE_URL to use a real environment
    baseURL: process.env.BASE_URL ?? 'http://localhost:3333',
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npx tsx mock-server/server.ts',
        url: 'http://localhost:3333/health',
        reuseExistingServer: true,
      },
});
