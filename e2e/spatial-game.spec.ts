import { test, expect } from '@playwright/test'

test('空間モード: 出題が始まりマスをタップして回答できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /空間モード/ }).click()
  await page.getByRole('button', { name: /レベル1（3×3・3マス）/ }).click()

  // ready(1000ms)+showing(3マス×950ms)を経てanswringフェーズに入るまで待つ
  await expect(
    page.getByText('逆の順番でマスをタップしてください'),
  ).toBeVisible({ timeout: 10_000 })

  // 正誤は問わないスモークテスト。マスをタップできることだけ確認する
  const firstCell = page.getByRole('button', { name: /^マス1/ })
  await firstCell.click()
  await expect(firstCell).toContainText('1')
})
