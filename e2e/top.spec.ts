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

test('トップ画面: ミッション・お題・7日間チャレンジがコンパクトなチップで表示され、タップで詳細が開閉する', async ({
  page,
}) => {
  await page.goto('/')

  const missionChip = page.getByRole('button', { name: '🎯 今日のミッション' })
  const challengeChip = page.getByRole('button', { name: '🎯 本日のお題' })
  const programChip = page.getByRole('button', { name: '🗓️ 7日間チャレンジ' })
  await expect(missionChip).toBeVisible()
  await expect(challengeChip).toBeVisible()
  await expect(programChip).toBeVisible()

  // 「今日のおすすめ」カードは廃止済み
  await expect(page.getByText('今日のおすすめ')).toHaveCount(0)

  // 展開前は詳細が表示されない
  await expect(page.getByText('達成で +100XP')).toHaveCount(0)

  await missionChip.click()
  await expect(page.getByText('達成で +100XP')).toBeVisible()

  // 別のチップを開くと前の詳細は閉じる
  await challengeChip.click()
  await expect(page.getByText('達成で +100XP')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '挑戦する' })).toBeVisible()
})

test('トップ画面: 本日のお題は開始前に難易度を選べる（④-9）', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '🎯 本日のお題' }).click()
  const lv1 = page.getByRole('button', { name: 'レベル1（3桁）' })
  const lv3 = page.getByRole('button', { name: 'レベル3（5桁）' })
  await expect(lv1).toBeVisible()
  await expect(lv3).toBeVisible()

  await lv3.click()
  await expect(lv3).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: '挑戦する' }).click()
  await expect(page.getByText('よく覚えてください')).toBeVisible()
  // レベル3=5桁の数字が表示される
  await expect(page.locator('p.text-4xl.font-bold.tabular-nums')).toHaveText(/^\d{5}$/)
})
