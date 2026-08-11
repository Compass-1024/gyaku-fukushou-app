import { test, expect } from '@playwright/test'

test('PWAショートカット: ?shortcut=word で直接ことばモードのレベル選択に入る', async ({
  page,
}) => {
  await page.goto('/?shortcut=word')
  await expect(
    page.getByRole('heading', { name: 'ことばモード' }),
  ).toBeVisible()
  // URLのクエリはクリーンなパスに置き換わる
  await expect(page).toHaveURL(/\/$/)
})

test('PWAショートカット: ?shortcut=spatial で直接空間モードのレベル選択に入る', async ({
  page,
}) => {
  await page.goto('/?shortcut=spatial')
  await expect(
    page.getByRole('heading', { name: '空間モード' }),
  ).toBeVisible()
})

test('PWAショートカット: ?shortcut=digit-sum で直接すうじモード（合計）のレベル選択に入る（Android対応⑬）', async ({
  page,
}) => {
  await page.goto('/?shortcut=digit-sum')
  await expect(
    page.getByRole('heading', { name: /すうじモード（合計を入力）/ }),
  ).toBeVisible()
})

test('PWAショートカット: ?shortcut=random で直接ランダムモードのレベル選択に入る（Android対応⑬）', async ({
  page,
}) => {
  await page.goto('/?shortcut=random')
  await expect(
    page.getByRole('heading', { name: 'ランダムモード' }),
  ).toBeVisible()
})

test('PWAショートカット: 不明な値の場合はトップ画面が表示される', async ({
  page,
}) => {
  await page.goto('/?shortcut=unknown')
  await expect(
    page.getByRole('heading', { name: 'おぼえトレ' }),
  ).toBeVisible()
})
