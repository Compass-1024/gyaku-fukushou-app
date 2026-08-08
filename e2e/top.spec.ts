import { test, expect } from '@playwright/test'

test('トップ画面が表示され、9つのモードカードが見える', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /ことばモード/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /すうじモード（逆から入力）/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /すうじモード（合計を入力）/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^Nバックモード/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /デュアルNバックモード/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /空間モード/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /変化検出モード/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /音・色モード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /ランダムモード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '統計' })).toBeVisible()
  await expect(page.getByRole('button', { name: '設定' })).toBeVisible()
})
