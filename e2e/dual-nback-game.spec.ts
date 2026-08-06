import { test, expect } from '@playwright/test'

test('Dual N-Backモード: 出題が始まり位置/音の一致を回答できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Dual N-Backモード/ }).click()
  await page
    .getByRole('button', { name: /レベル1（1つ前と比較）/ })
    .click()

  // ready(1000ms)を経てshowingフェーズに入るまで待つ
  await expect(page.getByRole('button', { name: '位置一致' })).toBeVisible({
    timeout: 10_000,
  })

  // 正誤は問わないスモークテスト。両方のボタンを押せることだけ確認する
  await page.getByRole('button', { name: '位置一致' }).click()
  await expect(page.getByRole('button', { name: '✓ 位置一致' })).toBeVisible()
  await page.getByRole('button', { name: '音一致' }).click()
  await expect(page.getByRole('button', { name: '✓ 音一致' })).toBeVisible()
})
