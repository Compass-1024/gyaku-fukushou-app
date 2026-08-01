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
    page.getByText('本アプリはサーバーを持たず', { exact: false }),
  ).toBeVisible()

  await page.getByRole('button', { name: '← 戻る' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
})

test('統計画面: 記録がない場合の案内が表示される', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  await expect(page.getByRole('heading', { name: '統計' })).toBeVisible()
  await expect(
    page.getByText('まだ記録がありません。プレイすると統計が表示されます。'),
  ).toBeVisible()
})
