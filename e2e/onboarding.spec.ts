import { test, expect } from '@playwright/test'

// playwright.config.tsのデフォルトstorageStateはオンボーディング既読状態を
// 注入しているため、初回起動時の表示を検証するにはこのテスト専用に空の
// storageStateを使い「初めての利用者」を再現する
test.use({ storageState: { cookies: [], origins: [] } })

test('初回起動時にオンボーディングガイドが表示され、スキップできる', async ({
  page,
}) => {
  await page.goto('/')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('1 / 3')).toBeVisible()

  await dialog.getByRole('button', { name: 'スキップ' }).click()
  await expect(dialog).not.toBeVisible()

  // スキップ後はトップ画面のモード選択が操作できる
  await expect(page.getByRole('button', { name: /ことばモード/ })).toBeVisible()

  // 既読状態が保存され、再訪問では表示されない
  await page.reload()
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('「次へ」を最後まで進めるとオンボーディングが閉じる', async ({ page }) => {
  await page.goto('/')

  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: '次へ' }).click()
  await expect(dialog.getByText('2 / 3')).toBeVisible()
  await dialog.getByRole('button', { name: '次へ' }).click()
  await expect(dialog.getByText('3 / 3')).toBeVisible()
  await dialog.getByRole('button', { name: 'はじめる' }).click()
  await expect(dialog).not.toBeVisible()
})
