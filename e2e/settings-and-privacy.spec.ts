import { test, expect } from '@playwright/test'

test('設定画面: テーマ切替とプライバシーポリシーへの遷移', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()

  await page.getByRole('button', { name: 'ダーク' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'プライバシーポリシー' }).click()
  await expect(
    page.getByRole('heading', { name: 'プライバシーポリシー' }),
  ).toBeVisible()
  await expect(
    page.getByText('本アプリの大部分の機能はサーバーを持たず', {
      exact: false,
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: '← 戻る' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
})

test('設定画面: BGMと効果音の音量スライダーが独立して切り替えられる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  await expect(page.getByText('効果音の音量')).toBeVisible()
  await expect(page.getByText('BGMの音量')).toBeVisible()

  const bgmSection = page.locator('section', { has: page.getByText('BGM', { exact: true }) })
  await expect(bgmSection.getByText('オフ')).toBeVisible()
  await bgmSection.getByRole('button', { name: 'オフ' }).click()
  await expect(bgmSection.getByText('オン')).toBeVisible()

  // 効果音セクションの状態には影響しない
  const soundSection = page.locator('section', { has: page.getByText('効果音', { exact: true }) })
  await expect(soundSection.getByText('オン')).toBeVisible()
})

test('設定画面: リマインド通知セクションが表示される', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  await expect(page.getByText('リマインド通知')).toBeVisible()
  // .env.localにVITE_VAPID_PUBLIC_KEYが設定されているため対応環境として
  // 扱われ、対応ブラウザ向けの説明文とトグルが表示される
  await expect(
    page.getByText('その日にまだ1回もプレイしていない場合', {
      exact: false,
    }),
  ).toBeVisible()
  const notificationSection = page.locator('section', {
    has: page.getByText('リマインド通知', { exact: true }),
  })
  await expect(notificationSection.getByRole('button', { name: 'オフ' })).toBeVisible()
})

test('統計画面: 記録がない場合の案内が表示される', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  await expect(page.getByRole('heading', { name: '統計' })).toBeVisible()
  await expect(
    page.getByText('まだ記録がありません。プレイすると統計が表示されます。'),
  ).toBeVisible()
})

test('統計画面: 十分な記録があると「ワーキングメモリの目安」が表示される', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const now = Date.now()
    const history = Array.from({ length: 2 }, (_, i) => ({
      mode: 'spatial',
      level: 2,
      correct: 3,
      total: 3,
      timestamp: new Date(now - i * 86400000).toISOString(),
    }))
    window.localStorage.setItem('gyaku-fukushou:history', JSON.stringify(history))
  })
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリの目安' }),
  ).toBeVisible()
  await expect(page.getByText('視空間スパン（空間モード）')).toBeVisible()
  await expect(page.getByText('4マス', { exact: true })).toBeVisible()
  await expect(
    page.getByText('医学的な診断や公式な認知機能評価ではなく', { exact: false }),
  ).toBeVisible()
})
