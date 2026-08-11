import { test, expect } from '@playwright/test'

test('処理記憶モード: 暗算の正誤判定→数字の記憶を経て回答フェーズに入り、回答できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /処理記憶モード/ }).click()
  await page.getByRole('button', { name: /レベル1（3試行）/ }).click()

  // ready(1000ms)を経て1試行目の暗算の正誤判定が表示される
  await expect(page.getByText('この式は合っている？')).toBeVisible({
    timeout: 5_000,
  })
  await page.getByRole('button', { name: '⭕ 合っている' }).click()

  // 3試行分の「暗算判定→数字表示」を経て回答フェーズに入るまで待つ
  await expect(
    page.getByText('覚えた数字を順番のまま入力してください'),
  ).toBeVisible({ timeout: 15_000 })

  // 正誤は問わないスモークテスト。テンキーで回答できることだけ確認する
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.locator('div.tracking-widest')).toHaveText('1')
})

test('処理記憶モード: 3問完走すると結果画面に暗算の正誤判定の内訳が表示される', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /処理記憶モード/ }).click()
  await page.getByRole('button', { name: /レベル1（3試行）/ }).click()

  for (let q = 0; q < 3; q++) {
    await expect(page.getByText('この式は合っている？')).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: '⭕ 合っている' }).click()
    await expect(
      page.getByText('覚えた数字を順番のまま入力してください'),
    ).toBeVisible({ timeout: 15_000 })
    // タイムアウトによる自動採点を待つ（あえて未入力のまま進める）
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/暗算の正誤判定: \d \/ 3問正解/)).toBeVisible()
    await page.getByRole('button', { name: /^(次へ|結果を見る)$/ }).click()
  }

  await expect(page.getByText(/問正解/)).toBeVisible()
})

test('処理記憶モード: 回答フェーズを一時停止すると残り時間が保持される', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /処理記憶モード/ }).click()
  await page.getByRole('button', { name: /レベル1（3試行）/ }).click()

  await expect(page.getByText('この式は合っている？')).toBeVisible({
    timeout: 5_000,
  })
  await page.getByRole('button', { name: '⭕ 合っている' }).click()
  await expect(
    page.getByText('覚えた数字を順番のまま入力してください'),
  ).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: '⏸ 一時停止' }).click()
  await expect(
    page.getByText('一時停止中です。準備ができたら再開してください'),
  ).toBeVisible()

  // レベル1の回答タイムアウトは8秒(base2000ms+3試行×2000ms)。
  // 一時停止せずに待てば自動採点されるはずだが、9秒待っても
  // 一時停止画面のままであることを確認する
  await page.waitForTimeout(9_000)
  await expect(
    page.getByText('一時停止中です。準備ができたら再開してください'),
  ).toBeVisible()

  await page.getByRole('button', { name: '▶ 再開する' }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.locator('div.tracking-widest')).toHaveText('1')
})
