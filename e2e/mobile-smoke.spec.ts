import { test, expect } from '@playwright/test'

// Android実装を見据え、モバイル幅（Pixel 7相当、playwright.config.tsの
// 'mobile'プロジェクト）でも主要導線が壊れていないことを確認する
// 最小限のスモークテスト。詳細な機能検証は他のe2eファイル（デスクトップ幅）で
// カバーしているため、ここではレイアウト崩れ・タップ領域の問題の検知に絞る

test('モバイル幅: トップ画面の主要ボタンが表示され、最小タップ領域を満たす', async ({
  page,
}) => {
  await page.goto('/')

  const modeButton = page.getByRole('button', { name: /すうじモード（逆から入力）/ })
  await expect(modeButton).toBeVisible()

  const box = await modeButton.boundingBox()
  expect(box).not.toBeNull()
  // Androidの推奨タップ領域(48dp)に対し、モードカード全体は十分な高さを持つべき
  expect(box!.height).toBeGreaterThanOrEqual(40)

  // 横スクロールが発生していない（レイアウト崩れの典型的な兆候）
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('モバイル幅: すうじモードの出題→回答→結果表示までの一連の流れが動作する', async ({
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

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('モバイル幅: 設定画面・統計画面が横スクロールなく表示できる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  let hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)

  await page.getByRole('button', { name: '← 戻る' }).click()
  await page.getByRole('button', { name: '統計' }).click()
  await expect(page.getByRole('heading', { name: '統計' })).toBeVisible()
  hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})
