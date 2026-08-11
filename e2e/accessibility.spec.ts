import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// axe-coreによる自動アクセシビリティ検証（WCAG 2.0/2.1 A・AAルール、
// カラーコントラストのcolor-contrastルールを含む）。
// 主要な静的画面を対象にする。タイマー/音声で状態が頻繁に変わるゲーム画面は
// スキャン結果が不安定になりやすいため対象外とし、レベル選択画面等の
// 静的な画面を代表として検証する。

async function expectNoViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

test('トップ画面にアクセシビリティ違反がない', async ({ page }) => {
  await page.goto('/')
  await expectNoViolations(page)
})

test('個別選択モード画面にアクセシビリティ違反がない', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await expect(page.getByRole('heading', { name: 'モードを選ぶ' })).toBeVisible()
  await expectNoViolations(page)
})

test('今日のミッション画面にアクセシビリティ違反がない', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /今日のミッション/ }).click()
  await expect(page.getByRole('heading', { name: /今日のミッション/ })).toBeVisible()
  await expectNoViolations(page)
})

test('設定画面にアクセシビリティ違反がない', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  await expectNoViolations(page)
})

test('統計画面にアクセシビリティ違反がない', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()
  await expect(page.getByRole('heading', { name: '統計' })).toBeVisible()
  await expectNoViolations(page)
})

test('ことばモードのレベル選択画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /ことばモード/ }).click()
  await expect(
    page.getByRole('heading', { name: 'ことばモード' }),
  ).toBeVisible()
  await expectNoViolations(page)
})

test('すうじモードのレベル選択画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await expect(
    page.getByRole('button', { name: /レベル1（3桁）/ }),
  ).toBeVisible()
  await expectNoViolations(page)
})

test('Nバックモードのレベル選択画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /^Nバックモード/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Nバックモード' }),
  ).toBeVisible()
  await expectNoViolations(page)
})

test('空間モードのレベル選択画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /空間モード/ }).click()
  await expect(page.getByRole('heading', { name: '空間モード' })).toBeVisible()
  await expectNoViolations(page)
})

test('変化検出モードのレベル選択画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /変化検出モード/ }).click()
  await expect(
    page.getByRole('heading', { name: '変化検出モード' }),
  ).toBeVisible()
  await expectNoViolations(page)
})

test('音・色モードのレベル選択画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()
  await page.getByRole('button', { name: /音・色モード/ }).click()
  await expect(page.getByRole('heading', { name: '音・色モード' })).toBeVisible()
  await expectNoViolations(page)
})

test('プライバシーポリシー画面にアクセシビリティ違反がない', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()
  await page.getByRole('button', { name: 'プライバシーポリシー' }).click()
  await expect(
    page.getByRole('heading', { name: 'プライバシーポリシー' }),
  ).toBeVisible()
  await expectNoViolations(page)
})
