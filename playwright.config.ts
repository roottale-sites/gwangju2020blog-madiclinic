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
    // 로컬 CMS 키가 있어도 상태 안내 테스트는 운영 데이터를 조회하지 않는다.
    env: { ROOTTALE_API_KEY: 'local_unconfigured' },
    url: baseURL,
    reuseExistingServer: false,
  },
});
