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
