import { test, expect } from '@playwright/test'

test('変化検出モード: 出題が始まりマスを選択して回答できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /変化検出モード/ }).click()
  await page.getByRole('button', { name: /レベル1（4×4・4マス）/ }).click()

  // ready(1000ms)+showing(3000ms表示+500ms空白)を経てanswringフェーズに入るまで待つ
  await expect(
    page.getByText('さっき青色だったマスをすべて選んでください'),
  ).toBeVisible({ timeout: 10_000 })

  // 正誤は問わないスモークテスト。適当にいくつかマスをタップしてから回答する
  const cells = page.getByRole('button', { name: /^マス\d+/ })
  await cells.nth(0).click()
  await cells.nth(1).click()
  await page.getByRole('button', { name: '回答する' }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  await expect(page.getByRole('button', { name: '次へ' })).toBeVisible()
})
