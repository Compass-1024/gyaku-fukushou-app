import { test, expect } from '@playwright/test'

test('今日のミッション: 弱点モード・レベルが表示され、はじめるボタンで直接ゲーム画面へ遷移する', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /今日のミッション/ }).click()

  await expect(page.getByRole('heading', { name: /今日のミッション/ })).toBeVisible()
  // 履歴が無い新規ユーザーには既定ターゲット（すうじ・逆から入力・レベル1）が表示される
  await expect(page.getByText('すうじ（逆から）')).toBeVisible()
  await expect(page.getByText('0 / 3 セット達成')).toBeVisible()

  await page.getByRole('button', { name: 'はじめる' }).click()
  // レベル選択を経由せず、直接ゲーム画面（回答フェーズ）まで遷移する
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })
})

test('今日のミッション: 3セット達成するとグレーアウトして達成済み表示になる（バグ修正）', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await page.getByRole('button', { name: /今日のミッション/ }).click()
  await page.getByRole('button', { name: 'はじめる' }).click()

  async function playOneSet() {
    for (let q = 0; q < 3; q++) {
      await expect(
        page.getByText('逆から入力してください'),
      ).toBeVisible({ timeout: 15_000 })
      await page.getByRole('button', { name: '1', exact: true }).click()
      await page.getByRole('button', { name: '2', exact: true }).click()
      await page.getByRole('button', { name: '3', exact: true }).click()
      await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
      await page.getByRole('button', { name: /^(次へ|結果を見る)$/ }).click()
    }
    // 3問完了でSetSummary（結果まとめ画面）に到達する
    await expect(page.getByText(/問正解/)).toBeVisible()
  }

  // 1セット目
  await playOneSet()
  await page.getByRole('button', { name: '同じレベルでもう一度' }).click()
  // 2セット目
  await playOneSet()
  await page.getByRole('button', { name: '同じレベルでもう一度' }).click()
  // 3セット目
  await playOneSet()

  await page.getByRole('button', { name: 'レベル選択に戻る' }).click()
  await page.getByRole('button', { name: '← モード選択' }).click()
  await page.getByRole('button', { name: '← ホーム' }).click()

  // 3セット達成後は、ホーム画面のボタン自体もグレーアウト（✅）表示になる
  const missionButton = page.getByRole('button', { name: /✅/ })
  await expect(missionButton).toBeVisible()
  await missionButton.click()

  await expect(page.getByText('3 / 3 セット達成')).toBeVisible()
  await expect(
    page.getByText('今日のミッションは達成済みです', { exact: false }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'はじめる' })).toHaveCount(0)
})
