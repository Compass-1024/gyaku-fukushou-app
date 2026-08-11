import { test, expect } from '@playwright/test'

test('デュアルNバックモード: 出題が始まり位置/音の一致を回答できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /デュアルNバックモード/ }).click()
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

test('デュアルNバックモード: アダプティブ難易度モードで最後まで完走し、到達した最大Nが結果画面に表示される', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /デュアルNバックモード/ }).click()

  // 出題数を最小(10問)にしてテストを短時間で終わらせる
  await page.getByRole('button', { name: '10問' }).click()
  await page.getByRole('checkbox', { name: 'アダプティブ（おすすめ）' }).check()
  await page.getByRole('button', { name: /レベル1（1つ前と比較）/ }).click()

  await expect(page.getByText('現在: 1個前')).toBeVisible({ timeout: 5_000 })

  // 10試行が終わるまで待つ（1試行あたりshowing 2000ms + gap 400ms = 2400ms、
  // ready 1000msを加えた実行時間に十分な余裕を持たせる）
  await expect(page.getByText(/問正解/)).toBeVisible({ timeout: 35_000 })
  await expect(page.getByText(/到達した最大N/)).toBeVisible()
})

test('デュアルNバックモード: 結果画面の全試行内訳（10試行×2=20行）は既定で折りたたまれており、ボタンで展開できる（改善: 長大リストの解消）', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /デュアルNバックモード/ }).click()
  await page.getByRole('button', { name: '10問' }).click()
  await page.getByRole('button', { name: /レベル1（1つ前と比較）/ }).click()

  // 何も操作せず10試行をタイムアウトで進め、結果画面まで到達する
  await expect(page.getByText(/問正解/)).toBeVisible({ timeout: 35_000 })

  const toggle = page.getByRole('button', { name: /内訳を表示（全20問）/ })
  await expect(toggle).toBeVisible()
  await expect(page.getByText(/^問題1[:：]/)).toHaveCount(0)

  await toggle.click()
  await expect(page.getByText(/^問題1[:：]/)).toBeVisible()
  await expect(page.getByRole('button', { name: '内訳を隠す' })).toBeVisible()
})
