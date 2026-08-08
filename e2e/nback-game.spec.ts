import { test, expect } from '@playwright/test'

test('Nバックモード: 出題が始まり「一致」ボタンを押せる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Nバックモード/ }).click()
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

test('Nバックモード: アダプティブ難易度モードで最後まで完走し、到達した最大Nが結果画面に表示される', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Nバックモード/ }).click()

  // 出題数を最小(10問)にしてテストを短時間で終わらせる
  await page.getByRole('button', { name: '10問' }).click()
  await page.getByRole('checkbox', { name: 'アダプティブ（おすすめ）' }).check()
  await page.getByRole('button', { name: /レベル1（1つ前と比較）/ }).click()

  await expect(page.getByText('現在: 1個前')).toBeVisible({ timeout: 5_000 })

  // 10試行が終わるまで待つ（1試行あたりshowing 1800ms + gap 400ms = 2200ms、
  // ready 1000msを加えた実行時間に十分な余裕を持たせる）
  await expect(page.getByText(/問正解/)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/到達した最大N/)).toBeVisible()
})
