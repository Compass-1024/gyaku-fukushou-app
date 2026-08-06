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
      page.getByRole('button', { name: /^N-Back Mode/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Dual N-Back Mode/ }),
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
    await expect(
      page.getByRole('button', { name: /Sequence Mode/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Random Mode/ }),
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

test('設定画面から言語を英語に切り替えると、ことばモードボタンが消える', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /ことばモード/ })).toBeVisible()

  await page.getByRole('button', { name: '設定' }).click()
  await page.getByRole('button', { name: 'English' }).click()

  await expect(
    page.getByRole('heading', { name: 'Settings' }),
  ).toBeVisible()
  // 読み上げ速度/声の設定はことばモード専用のため、英語版では非表示になる
  await expect(page.getByText('読み上げ速度')).toHaveCount(0)

  await page.getByRole('button', { name: '← Back' }).click()
  await expect(
    page.getByRole('heading', { name: 'Working Memory Training' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Word Mode/ }),
  ).not.toBeVisible()
})
