import { test, expect } from '@playwright/test'

test('すうじモード（逆から入力）: 出題→回答→結果表示までの一連の流れ', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード/ }).click()
  await page.getByRole('button', { name: /逆から入力/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()

  // ready → showing を経て answering フェーズに入るまで待つ
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })

  // テンキーで3桁入力する（正誤は問わないスモークテスト）。
  // レベル1は3桁＝maxAnswerLengthのため、逆からモードでは3桁目の入力で
  // 「決定」を押さずとも自動的に採点され結果表示に切り替わる
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()

  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  await expect(page.getByRole('button', { name: '次へ' })).toBeVisible()
})

test('すうじモード: 結果表示中はEnterキーでも次の問題へ進める', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード/ }).click()
  await page.getByRole('button', { name: /逆から入力/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()

  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()

  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  await expect(page.getByText('問題 1 / 3')).toBeVisible()

  await page.keyboard.press('Enter')

  await expect(page.getByText('問題 2 / 3')).toBeVisible()
})

test('すうじモード: SetSummary（3問完了後）でもEnterキーで主要アクションを実行できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード/ }).click()
  await page.getByRole('button', { name: /逆から入力/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()

  // 3問とも同じ手順で回答し、Enterキーで次の問題へ進める
  for (let i = 0; i < 3; i++) {
    await expect(
      page.getByText('逆から入力してください'),
    ).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: '2', exact: true }).click()
    await page.getByRole('button', { name: '3', exact: true }).click()
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
    await page.keyboard.press('Enter')
  }

  // 3問完了後はSetSummary（結果まとめ画面）が表示される
  await expect(page.getByText(/問正解/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: '同じレベルでもう一度' }),
  ).toBeVisible()

  // SetSummaryの主要アクション（提案がなければ「同じレベルでもう一度」）を
  // Enterキーで実行できる。実行後は新しい1問目のready→showingフェーズに戻る
  await page.keyboard.press('Enter')
  await expect(page.getByText('問題 1 / 3')).toBeVisible()
})
