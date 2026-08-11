import { test, expect } from '@playwright/test'

test.describe('ことばモード: SpeechRecognition非対応ブラウザ向けフォールバック', () => {
  test.beforeEach(async ({ page }) => {
    // ページスクリプト実行前にSpeechRecognition/webkitSpeechRecognitionを
    // 取り除き、非対応ブラウザをエミュレートする
    await page.addInitScript(() => {
      // @ts-expect-error テスト用に非対応ブラウザを再現するため削除する
      delete window.SpeechRecognition
      // @ts-expect-error 同上
      delete window.webkitSpeechRecognition
    })
  })

  test('レベル選択がブロックされず、テキスト入力で回答できる', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /個別選択モード/ }).click()
    await page.getByRole('button', { name: /ことばモード/ }).click()

    await expect(
      page.getByText('お使いのブラウザは音声認識に対応していません'),
    ).toBeVisible()

    const level1 = page.getByRole('button', { name: /レベル1/ })
    await expect(level1).toBeEnabled()
    await level1.click()

    // 読み上げ→復唱フェーズを経て、テキスト入力フォームが表示されるまで待つ
    await expect(
      page.getByLabel('逆から読んだ答え'),
    ).toBeVisible({ timeout: 15_000 })

    await page.getByLabel('逆から読んだ答え').fill('てすと')
    await page.getByRole('button', { name: '決定' }).click()

    await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()
  })
})
