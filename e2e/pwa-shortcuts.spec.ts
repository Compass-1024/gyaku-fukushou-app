import { test, expect } from '@playwright/test'

test('PWAショートカット: ?shortcut=word で直接ことばモードのレベル選択に入る', async ({
  page,
}) => {
  await page.goto('/?shortcut=word')
  await expect(
    page.getByRole('heading', { name: 'ことばモード' }),
  ).toBeVisible()
  // URLのクエリはクリーンなパスに置き換わる
  await expect(page).toHaveURL(/\/$/)
})

test('PWAショートカット: ?shortcut=spatial で直接空間モードのレベル選択に入る', async ({
  page,
}) => {
  await page.goto('/?shortcut=spatial')
  await expect(
    page.getByRole('heading', { name: '空間モード' }),
  ).toBeVisible()
})

test('PWAショートカット: 不明な値の場合はトップ画面が表示される', async ({
  page,
}) => {
  await page.goto('/?shortcut=unknown')
  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
})
