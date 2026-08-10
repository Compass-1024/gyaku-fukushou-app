import { test, expect } from '@playwright/test'

test('すうじモード（逆から入力）: 出題→回答→結果表示までの一連の流れ', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
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

test('すうじモード: セット途中でページを再読み込みしても、それまでの結果を保持して再開できる（Android対応⑨）', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  await page.getByRole('button', { name: /^(次へ|結果を見る)$/ }).click()
  await expect(page.getByText('問題 2 / 3')).toBeVisible({ timeout: 15_000 })

  // モバイルOSがバックグラウンドでプロセスを再生成する状況を、
  // ページ再読み込み（トップ画面からのやり直しではなく）で再現する
  await page.reload()

  // トップ画面に戻らず、同じすうじモードの2問目から再開できる
  await expect(page.getByText('問題 2 / 3')).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })
})

test('すうじモード: 意図的に「← レベル選択」で退出した場合は、再度同じレベルに入っても前回の途中経過を復元しない（Android対応⑨）', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  await page.getByRole('button', { name: /^(次へ|結果を見る)$/ }).click()
  await expect(page.getByText('問題 2 / 3')).toBeVisible({ timeout: 15_000 })

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '← レベル選択' }).click()
  await expect(page.getByRole('heading', { name: /すうじモード（逆から入力）/ })).toBeVisible()

  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('問題 1 / 3')).toBeVisible()
})

test('すうじモード: アダプティブ難易度モードで最後まで完走し、到達した最大レベルが結果画面に表示される（④-2）', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('checkbox', { name: 'アダプティブ（おすすめ）' }).check()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()

  // アダプティブ時は問題ごとに桁数(3/5/7)が変わりうるため、決まった回数だけ
  // タップするのではなく、結果フェーズに切り替わるまで1桁ずつタップし続ける
  async function answerOneQuestion() {
    for (let i = 0; i < 7; i++) {
      if (await page.getByText(/^(正解|不正解)$/).isVisible()) return
      await page.getByRole('button', { name: '1', exact: true }).click()
    }
  }

  for (let q = 0; q < 3; q++) {
    await expect(
      page.getByText('逆から入力してください'),
    ).toBeVisible({ timeout: 15_000 })
    await answerOneQuestion()
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
    await page.getByRole('button', { name: /^(次へ|結果を見る)$/ }).click()
  }

  await expect(page.getByText(/問正解/)).toBeVisible()
  await expect(page.getByText(/到達した最大レベル/)).toBeVisible()
})

test('すうじモード: 回答フェーズを一時停止すると残り時間が保持され、再開すると続きからカウントダウンする', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()

  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: '⏸ 一時停止' }).click()
  await expect(page.getByText('一時停止中です。準備ができたら再開してください')).toBeVisible()

  // テンキーが隠れており、一時停止中は数字を入力できない
  await expect(page.getByRole('button', { name: '1', exact: true })).toHaveCount(0)

  // レベル1の回答タイムアウトは8秒。一時停止せずに9秒待てば自動採点で
  // 結果画面に切り替わるはずだが、一時停止中はタイムアウトが進まないため
  // 9秒待っても一時停止画面のままであることを確認する
  await page.waitForTimeout(9_000)
  await expect(page.getByText('一時停止中です。準備ができたら再開してください')).toBeVisible()

  await page.getByRole('button', { name: '▶ 再開する' }).click()
  await expect(
    page.getByText('逆から入力してください'),
  ).toBeVisible()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
})

test('すうじモード: 結果表示中はEnterキーでも次の問題へ進める', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
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
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
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
