import { test, expect } from '@playwright/test'

test.describe('英語UI（language: en）', () => {
  test.beforeEach(async ({ page }) => {
    // ページスクリプト実行前にlocalStorageへ言語設定を書き込み、
    // 英語UIで初回描画されるようにする
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'gyaku-fukushou:settings',
        JSON.stringify({ language: 'en' }),
      )
    })
  })

  test('トップ画面が英語表示になり、ことばモードボタンが存在しない', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Working Memory Training' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Word Mode/ }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: /Digit Mode/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /N-Back Mode/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Spatial Mode/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Change Detection Mode/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Tone & Color Mode/ }),
    ).toBeVisible()
  })

  test('?shortcut=wordで開いても、英語版ではトップ画面のままになる', async ({
    page,
  }) => {
    await page.goto('/?shortcut=word')

    await expect(
      page.getByRole('heading', { name: 'Working Memory Training' }),
    ).toBeVisible()
  })
})
