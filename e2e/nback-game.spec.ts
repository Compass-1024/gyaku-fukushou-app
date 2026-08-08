import { test, expect } from '@playwright/test'

test('Nバックモード: 出題が始まり「一致」ボタンを押せる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Nバックモード/ }).click()
  await page.getByRole('button', { name: /レベル1（1つ前と比較）/ }).click()

  await expect(
    page.getByText('1個前と同じ位置なら「一致」を押してください'),
  ).toBeVisible()

  // ready(1000ms)経過後、最初の試行の「一致」ボタンが操作可能になる
  const matchButton = page.getByRole('button', { name: /一致/ })
  await expect(matchButton).toBeVisible({ timeout: 5_000 })
  await matchButton.click()
  await expect(page.getByRole('button', { name: '✓ 一致' })).toBeVisible()
})
