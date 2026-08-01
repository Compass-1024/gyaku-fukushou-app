import { test, expect } from '@playwright/test'

test('ことばモード: レベル選択画面へ遷移し、戻るボタンでトップに戻れる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /ことばモード/ }).click()

  await expect(
    page.getByRole('heading', { name: 'ことばモード' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /レベル1（2〜4文字の単語）/ }),
  ).toBeVisible()

  await page.getByRole('button', { name: '← モード選択' }).click()
  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
})

test('すうじモード: タイプ選択→レベル選択と遷移できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード/ }).click()

  await expect(
    page.getByRole('heading', { name: 'すうじモード' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /逆から入力/ }).click()

  await expect(
    page.getByRole('button', { name: /レベル1（3桁）/ }),
  ).toBeVisible()
})

test('Nバックモード: レベル選択画面へ遷移できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Nバックモード/ }).click()

  await expect(
    page.getByRole('heading', { name: 'Nバックモード' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /レベル1（1つ前と比較）/ }),
  ).toBeVisible()
})

test('空間モード: レベル選択画面へ遷移できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /空間モード/ }).click()

  await expect(
    page.getByRole('heading', { name: '空間モード' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /レベル1（3×3・3マス）/ }),
  ).toBeVisible()
})

test('変化検出モード: レベル選択画面へ遷移できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /変化検出モード/ }).click()

  await expect(
    page.getByRole('heading', { name: '変化検出モード' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /レベル1（4×4・4マス）/ }),
  ).toBeVisible()
})

test('音・色モード: レベル選択画面へ遷移できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /音・色モード/ }).click()

  await expect(
    page.getByRole('heading', { name: '音・色モード' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /レベル1（3音）/ }),
  ).toBeVisible()
})

test('ブラウザバックでトップ画面に戻れる（History API連動）', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード/ }).click()
  await expect(
    page.getByRole('heading', { name: 'すうじモード' }),
  ).toBeVisible()

  await page.goBack()
  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
})
