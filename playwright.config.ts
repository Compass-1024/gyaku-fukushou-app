import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    // 初回起動時オンボーディングガイド(OnboardingGuide)は既存の主要導線テストの
    // 対象外（トップ画面のモード選択が覆われてしまうため）。ここで既読状態を
    // 注入し「2回目以降の利用者」を既定の前提にする。オンボーディング自体の
    // 表示確認は e2e/onboarding.spec.ts が個別のブラウザコンテキストで行う
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [{ name: 'gyaku-fukushou:onboardingSeen', value: '1' }],
        },
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
