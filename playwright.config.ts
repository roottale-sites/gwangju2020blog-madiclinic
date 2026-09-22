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
    // 루트는 외부 병원 홈페이지로 이동하므로 로컬 목록으로 준비 상태를 확인한다.
    url: `${baseURL}/column`,
    reuseExistingServer: false,
  },
});
