import { test, expect } from '@playwright/test'

test('ランダムモード: 5ラウンド完了までの一連の流れ', async ({ page }) => {
  // 5ラウンド分のready→showing→answering(タイムアウト)を待つため、
  // デフォルトのテストタイムアウトでは足りない
  test.setTimeout(120_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  // 正誤は問わないスモークテスト。5ラウンド分、出現するUIに応じて
  // 何かしら操作するか、タイムアウトによる自動採点を待ってから次へ進む
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`問題 ${round} / 5`)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({
      timeout: 20_000,
    })
    const nextButton = page.getByRole('button', {
      name: round === 5 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }

  await expect(page.getByText(/問正解/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: '同じレベルでもう一度' }),
  ).toBeVisible()
})
