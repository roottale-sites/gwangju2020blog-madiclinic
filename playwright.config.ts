import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:49117';

export default defineConfig({
  testDir: './tests',
  workers: 2,
  reporter: 'line',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm exec next start --hostname localhost --port 49117',
    url: baseURL,
    reuseExistingServer: false,
  },
});
