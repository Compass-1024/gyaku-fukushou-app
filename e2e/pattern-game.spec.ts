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

test('変化検出モード: 回答フェーズを一時停止すると残り時間が保持される', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /変化検出モード/ }).click()
  await page.getByRole('button', { name: /レベル1（4×4・4マス）/ }).click()

  await expect(
    page.getByText('さっき青色だったマスをすべて選んでください'),
  ).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: '⏸ 一時停止' }).click()
  await expect(
    page.getByText('一時停止中です。準備ができたら再開してください'),
  ).toBeVisible()

  // レベル1の回答タイムアウトは5.6秒(base4000ms+4マス×400ms)。
  // 一時停止せずに待てば自動採点されるはずだが、7秒待っても
  // 一時停止画面のままであることを確認する
  await page.waitForTimeout(7_000)
  await expect(
    page.getByText('一時停止中です。準備ができたら再開してください'),
  ).toBeVisible()

  await page.getByRole('button', { name: '▶ 再開する' }).click()
  const cells = page.getByRole('button', { name: /^マス\d+/ })
  await cells.nth(0).click()
  await page.getByRole('button', { name: '回答する' }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
})
