import { test, expect } from '@playwright/test'

test('トップ画面が表示され、3ボタン（ランダム/個別選択/今日のミッション）が見える', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /ランダムモード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /個別選択モード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /今日のミッション/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '統計' })).toBeVisible()
  await expect(page.getByRole('button', { name: '設定' })).toBeVisible()

  // 旧版の9モードグリッドやミッション/お題/7日間チャレンジのチップ行は
  // トップ画面から撤去済み（個別選択モード画面へ移動）
  await expect(page.getByRole('button', { name: /^すうじモード/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '🎯 本日のお題' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '🗓️ 7日間チャレンジ' })).toHaveCount(0)
})

test('個別選択モード画面: 9モードのうちランダムモードを除く8モードのカードが見える', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /個別選択モード/ }).click()

  await expect(page.getByRole('heading', { name: 'モードを選ぶ' })).toBeVisible()
  await expect(page.getByRole('button', { name: /ことばモード/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /すうじモード（逆から入力）/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /すうじモード（合計を入力）/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /^Nバックモード/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /デュアルNバックモード/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /空間モード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /変化検出モード/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /音・色モード/ })).toBeVisible()
  // ランダムモードはホーム画面に専用ボタンがあるため、ここには表示しない
  await expect(page.getByRole('button', { name: /ランダムモード/ })).toHaveCount(0)

  await page.getByRole('button', { name: '← ホーム' }).click()
  await expect(
    page.getByRole('heading', { name: 'ワーキングメモリトレーニング' }),
  ).toBeVisible()
})

test('トップ画面: オフラインになるとオフラインバナーが表示される（Android対応⑥）', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await expect(page.getByText('📶 オフラインです')).toHaveCount(0)

  await context.setOffline(true)
  await expect(page.getByText('📶 オフラインです', { exact: false })).toBeVisible()

  await context.setOffline(false)
  await expect(page.getByText('📶 オフラインです', { exact: false })).toHaveCount(0)
})
