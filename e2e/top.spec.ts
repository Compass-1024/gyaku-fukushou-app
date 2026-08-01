import { test, expect } from '@playwright/test'

test('トップ画面が表示され、3つのモードボタンが見える', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /ことばモード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /すうじモード/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Nバックモード/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '統計' })).toBeVisible()
  await expect(page.getByRole('button', { name: '設定' })).toBeVisible()
})
