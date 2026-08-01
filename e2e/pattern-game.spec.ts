import { test, expect } from '@playwright/test'

test('変化検出モード: 出題が始まり変化の有無を回答できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /変化検出モード/ }).click()
  await page.getByRole('button', { name: /レベル1（4×4・4マス）/ }).click()

  // ready(1000ms)+showing(3000ms表示+500ms空白)を経てanswringフェーズに入るまで待つ
  await expect(
    page.getByText('さっきと模様は変わっていますか？'),
  ).toBeVisible({ timeout: 10_000 })

  // 正誤は問わないスモークテスト。回答ボタンを押して結果が表示されることだけ確認する
  await page.getByRole('button', { name: '変化なし' }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  await expect(page.getByRole('button', { name: '次へ' })).toBeVisible()
})
