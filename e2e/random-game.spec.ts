import { test, expect } from '@playwright/test'

test('ランダムモード: 5ラウンド完了までの一連の流れ', async ({ page }) => {
  // 5ラウンド分のready→showing→answering(タイムアウト)を待つため、
  // デフォルトのテストタイムアウトでは足りない
  test.setTimeout(120_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  // 正誤は問わないスモークテスト。5ラウンド分、出現するUIに応じて
  // 何かしら操作するか、タイムアウトによる自動採点を待ってから次へ進む
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`問題 ${round} / 5`)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({
      timeout: 20_000,
    })
    const nextButton = page.getByRole('button', {
      name: round === 5 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }

  await expect(page.getByText(/問正解/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: '同じレベルでもう一度' }),
  ).toBeVisible()
})

test('ランダムモード: 出題数を3問に変更すると3ラウンドで完了する（バグ修正）', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: '3問', exact: true }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  for (let round = 1; round <= 3; round++) {
    await expect(page.getByText(`問題 ${round} / 3`)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
    const nextButton = page.getByRole('button', {
      name: round === 3 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }

  await expect(page.getByText(/\/ 3 問正解/)).toBeVisible()
})

test('ランダムモード: 出題数を7問に変更すると7ラウンドで完了する（バグ修正）', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: '7問', exact: true }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  for (let round = 1; round <= 7; round++) {
    await expect(page.getByText(`問題 ${round} / 7`)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
    const nextButton = page.getByRole('button', {
      name: round === 7 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }

  await expect(page.getByText(/\/ 7 問正解/)).toBeVisible()
})

test('ランダムモード: 結果フェーズに単体モード画面と同じ詳細（正しい答え・自分の回答）が表示される（バグ修正）', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`問題 ${round} / 5`)).toBeVisible({ timeout: 15_000 })

    if (await page.getByText('逆から入力してください').isVisible().catch(() => false)) {
      await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText('出題: ')).toBeVisible()
      await expect(page.getByText('正しい答え: ')).toBeVisible()
      await expect(page.getByText('あなたの回答: ')).toBeVisible()
      return
    }

    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
    const nextButton = page.getByRole('button', {
      name: round === 5 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }
})

test('ランダムモード: 音・色ラウンドのパッドが単体モード画面と同じ4色で表示される（バグ修正）', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`問題 ${round} / 5`)).toBeVisible({ timeout: 15_000 })

    const redPad = page.getByRole('button', { name: '赤のパッド' })
    if (await redPad.isVisible().catch(() => false)) {
      const bluePad = page.getByRole('button', { name: '青のパッド' })
      const redClass = await redPad.getAttribute('class')
      const blueClass = await bluePad.getAttribute('class')
      expect(redClass).toContain('rose')
      expect(blueClass).toContain('sky')
      expect(redClass).not.toBe(blueClass)
      return
    }

    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
    const nextButton = page.getByRole('button', {
      name: round === 5 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }
})

test('ランダムモード: すうじ（合計）ラウンドは桁数分入力しても自動採点されず、決定ボタンで確定する（バグ修正）', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`問題 ${round} / 5`)).toBeVisible({ timeout: 15_000 })

    if (await page.getByText('全部たすといくつ？').isVisible().catch(() => false)) {
      // レベル1は3桁の出題だが、合計の最大文字数は2桁のはず。3桁分入力しても
      // 単体のすうじモード（合計）画面と同様に自動採点されず、結果フェーズに
      // 遷移していないことを確認する
      await page.getByRole('button', { name: '1', exact: true }).click()
      await page.getByRole('button', { name: '2', exact: true }).click()
      await page.getByRole('button', { name: '3', exact: true }).click()
      await expect(page.getByText(/^(正解|不正解)$/)).toHaveCount(0)
      await expect(page.getByText('全部たすといくつ？')).toBeVisible()

      await page.getByRole('button', { name: '決定' }).click()
      await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
      return
    }

    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
    const nextButton = page.getByRole('button', {
      name: round === 5 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }
})

test('ランダムモード: セット途中でページを再読み込みしても、それまでの結果を保持して再開できる（Android対応⑨）', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: '3問', exact: true }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  await expect(page.getByText('問題 1 / 3')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: '次へ' }).click()
  await expect(page.getByText('問題 2 / 3')).toBeVisible({ timeout: 15_000 })

  // モバイルOSがバックグラウンドでプロセスを再生成する状況をページ再読み込みで再現する
  await page.reload()

  await expect(page.getByText('問題 2 / 3')).toBeVisible({ timeout: 15_000 })
})

test('ランダムモード: すうじラウンドで「よく覚えてください」の表示位置が数字の切り替わり中も動かない', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('button', { name: /ランダムモード/ }).click()
  await page.getByRole('button', { name: /レベル1/ }).click()

  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`問題 ${round} / 5`)).toBeVisible({
      timeout: 15_000,
    })

    if (await page.getByText(/^すうじ（/).isVisible()) {
      const prompt = page.getByText('よく覚えてください')
      await expect(prompt).toBeVisible()
      const before = await prompt.boundingBox()
      // 1桁あたり表示700ms+間隔250msの切り替わりを2回分またぐまで待つ
      await page.waitForTimeout(1_900)
      const after = await prompt.boundingBox()
      expect(before).not.toBeNull()
      expect(after).not.toBeNull()
      expect(after!.y).toBe(before!.y)

      // 回答フェーズの指示文（単体のすうじモード画面と同じ文言）も表示される
      await expect(
        page.getByText(/逆から入力してください|全部たすといくつ？/),
      ).toBeVisible({ timeout: 15_000 })
      return
    }

    if (round === 1) {
      // 一時停止機能はどのラウンド種別でも共通のため、1ラウンド目の回答
      // フェーズが始まった時点で検証する（すうじラウンドだった場合は
      // 上のブロックで既にreturnしているため、ここに来るのは非すうじラウンド）
      await page.getByRole('button', { name: '⏸ 一時停止' }).click()
      await expect(
        page.getByText('一時停止中です。準備ができたら再開してください'),
      ).toBeVisible()
      // レベル1の各ラウンドの回答タイムアウトは最大でも9秒
      // (空間/音・色: base3000ms+3×2000ms)。10秒待っても一時停止画面の
      // ままであることを確認する
      await page.waitForTimeout(10_000)
      await expect(
        page.getByText('一時停止中です。準備ができたら再開してください'),
      ).toBeVisible()
      await page.getByRole('button', { name: '▶ 再開する' }).click()
    }

    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible({
      timeout: 20_000,
    })
    const nextButton = page.getByRole('button', {
      name: round === 5 ? '結果を見る' : '次へ',
    })
    await nextButton.click()
  }
})
