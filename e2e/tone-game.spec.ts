import { test, expect } from '@playwright/test'

test('音・色モード: 出題が始まりパッドをタップして回答できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
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

test('音・色モード: アダプティブ難易度モードで最後まで完走し、到達した最大レベルが結果画面に表示される（④-2）', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /音・色モード/ }).click()
  await page.getByRole('checkbox', { name: 'アダプティブ（おすすめ）' }).check()
  await page.getByRole('button', { name: /レベル1（3音）/ }).click()

  // アダプティブ時は問題ごとに音数(3/4/5)が変わりうるため、決まった回数
  // ではなく結果フェーズに切り替わるまで同じパッドをタップし続ける
  async function answerOneQuestion() {
    for (let i = 0; i < 5; i++) {
      if (await page.getByText(/^(正解|不正解)$/).isVisible()) return
      await page.getByRole('button', { name: '赤のパッド' }).click()
    }
  }

  for (let q = 0; q < 3; q++) {
    await expect(
      page.getByText('同じ順番でパッドをタップしてください'),
    ).toBeVisible({ timeout: 10_000 })
    await answerOneQuestion()
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
    await page.getByRole('button', { name: /^(次へ|結果を見る)$/ }).click()
  }

  await expect(page.getByText(/問正解/)).toBeVisible()
  await expect(page.getByText(/到達した最大レベル/)).toBeVisible()
})

test('音・色モード: 回答フェーズを一時停止すると残り時間が保持される', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /音・色モード/ }).click()
  await page.getByRole('button', { name: /レベル1（3音）/ }).click()

  await expect(
    page.getByText('同じ順番でパッドをタップしてください'),
  ).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: '⏸ 一時停止' }).click()
  await expect(
    page.getByText('一時停止中です。準備ができたら再開してください'),
  ).toBeVisible()

  // レベル1の回答タイムアウトは9秒(base3000ms+3音×2000ms)。
  // 一時停止せずに待てば自動採点されるはずだが、10秒待っても
  // 一時停止画面のままであることを確認する
  await page.waitForTimeout(10_000)
  await expect(
    page.getByText('一時停止中です。準備ができたら再開してください'),
  ).toBeVisible()

  await page.getByRole('button', { name: '▶ 再開する' }).click()
  await page.getByRole('button', { name: '赤のパッド' }).click()
  await expect(page.getByRole('button', { name: '赤のパッド' })).toContainText(
    '1',
  )
})
