import { test, expect } from '@playwright/test'

test('音・色モード: 出題が始まりパッドをタップして回答できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /音・色モード/ }).click()
  await page.getByRole('button', { name: /レベル1（3音）/ }).click()

  // ready(1000ms)+showing(3音×900ms)を経てanswringフェーズに入るまで待つ
  await expect(
    page.getByText('同じ順番でパッドをタップしてください'),
  ).toBeVisible({ timeout: 10_000 })

  // 正誤は問わないスモークテスト。パッドをタップできることだけ確認する
  await page.getByRole('button', { name: '赤のパッド' }).click()
  await expect(page.getByRole('button', { name: '赤のパッド' })).toContainText(
    '1',
  )
})
