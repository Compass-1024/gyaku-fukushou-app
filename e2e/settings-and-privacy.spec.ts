import { test, expect } from '@playwright/test'

test('設定画面: テーマ切替とプライバシーポリシーへの遷移', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()

  await page.getByRole('button', { name: 'ダーク' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'プライバシーポリシー' }).click()
  await expect(
    page.getByRole('heading', { name: 'プライバシーポリシー' }),
  ).toBeVisible()
  await expect(
    page.getByText('本アプリの大部分の機能はサーバーを持たず', {
      exact: false,
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: '← 戻る' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
})

test('設定画面: BGMと効果音の音量スライダーが独立して切り替えられる', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  await expect(page.getByText('効果音の音量')).toBeVisible()
  await expect(page.getByText('BGMの音量')).toBeVisible()

  const bgmSection = page.locator('section', { has: page.getByText('BGM', { exact: true }) })
  await expect(bgmSection.getByText('オフ')).toBeVisible()
  await bgmSection.getByRole('button', { name: 'オフ' }).click()
  await expect(bgmSection.getByText('オン')).toBeVisible()

  // 効果音セクションの状態には影響しない
  const soundSection = page.locator('section', { has: page.getByText('効果音', { exact: true }) })
  await expect(soundSection.getByText('オン')).toBeVisible()
})

test('設定画面: バイブレーションをオンにすると正誤判定時にnavigator.vibrateが呼ばれる（Android対応①）', async ({
  page,
}) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __vibrateCalls: unknown[] }).__vibrateCalls = []
    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      value: (pattern: unknown) => {
        ;(window as unknown as { __vibrateCalls: unknown[] }).__vibrateCalls.push(pattern)
        return true
      },
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()
  const hapticsSection = page.locator('section', { has: page.getByText('📳 バイブレーション') })
  await expect(hapticsSection.getByText('オフ')).toBeVisible()
  await hapticsSection.getByRole('button', { name: 'オフ' }).click()
  await expect(hapticsSection.getByText('オン')).toBeVisible()
  await page.getByRole('button', { name: '← 戻る' }).click()

  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()
  await expect(page.getByText('逆から入力してください')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page.getByText(/^(正解|不正解)$/)).toBeVisible()

  const callCount = await page.evaluate(
    () => (window as unknown as { __vibrateCalls: unknown[] }).__vibrateCalls.length,
  )
  expect(callCount).toBeGreaterThan(0)
})

test('設定画面: 集中モードをオンにするとゲーム画面の背景装飾が非表示になる（④-6）', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()
  await expect(page.getByText('逆から入力してください')).toBeVisible({ timeout: 15_000 })
  // 集中モードOFF（既定）ではゲーム画面にも背景装飾のぼかし円が3つ表示される
  await expect(page.locator('div.blur-3xl')).toHaveCount(3)

  await page.getByRole('button', { name: '← レベル選択' }).click()
  await page.getByRole('button', { name: '← モード選択' }).click()
  await page.getByRole('button', { name: '設定' }).click()
  const focusModeSection = page.locator('section', { has: page.getByText('🎯 集中モード') })
  await focusModeSection.getByRole('button', { name: 'オフ' }).click()
  await expect(focusModeSection.getByRole('button', { name: 'オン' })).toBeVisible()
  await page.getByRole('button', { name: '← 戻る' }).click()

  await page.getByRole('button', { name: /すうじモード（逆から入力）/ }).click()
  await page.getByRole('button', { name: /レベル1（3桁）/ }).click()
  await expect(page.getByText('逆から入力してください')).toBeVisible({ timeout: 15_000 })
  // 集中モードONではゲーム画面の背景装飾が非表示になる
  await expect(page.locator('div.blur-3xl')).toHaveCount(0)
})

test('設定画面: 履歴をCSVで書き出せる（④-3）', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '📊 履歴をCSVで書き出す' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^oboetore-history-\d{8}\.csv$/)
})

test('設定画面: リマインド通知セクションが表示される', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '設定' }).click()

  await expect(page.getByText('リマインド通知')).toBeVisible()
  // .env.localにVITE_VAPID_PUBLIC_KEYが設定されているため対応環境として
  // 扱われ、対応ブラウザ向けの説明文とトグルが表示される
  await expect(
    page.getByText('その日にまだ1回もプレイしていない場合', {
      exact: false,
    }),
  ).toBeVisible()
  const notificationSection = page.locator('section', {
    has: page.getByText('リマインド通知', { exact: true }),
  })
  await expect(notificationSection.getByRole('button', { name: 'オフ' })).toBeVisible()
})

test('統計画面: 記録がない場合の案内が表示される', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  await expect(page.getByRole('heading', { name: '統計' })).toBeVisible()
  await expect(
    page.getByText('まだ記録がありません。プレイすると統計が表示されます。'),
  ).toBeVisible()
})

test('統計画面: 十分な記録があると「ワーキングメモリの伸び」が表示される', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const now = Date.now()
    // 前半2件・後半2件、計4件（自己比較の最低要件）を古い順に生成する
    const history = Array.from({ length: 4 }, (_, i) => ({
      mode: 'spatial',
      level: 2,
      correct: 3,
      total: 3,
      timestamp: new Date(now - (4 - i) * 86400000).toISOString(),
    }))
    window.localStorage.setItem('gyaku-fukushou:history', JSON.stringify(history))
  })
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  const benchmarkSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'ワーキングメモリの伸び' }),
  })
  await expect(benchmarkSection).toBeVisible()
  await expect(benchmarkSection.getByText('空間モード')).toBeVisible()
  await expect(benchmarkSection.getByText('→ 100%')).toBeVisible()
  await expect(benchmarkSection.getByText('横ばい')).toBeVisible()
  await expect(
    page.getByText('医学的な診断や公式な認知機能評価ではなく', { exact: false }),
  ).toBeVisible()
})

test('統計画面: 実績・達成の通知センターに実績解除とミッション達成が新しい順に表示される（④-10）', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const history = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: '2026-01-01T00:00:00.000Z' },
    ]
    window.localStorage.setItem('gyaku-fukushou:history', JSON.stringify(history))
    window.localStorage.setItem(
      'gyaku-fukushou:missionCompletions',
      JSON.stringify([{ dateKey: '2026-01-05', missionId: 'digit-2' }]),
    )
  })
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  const section = page.locator('section', {
    has: page.getByRole('heading', { name: '🔔 実績・達成の通知センター' }),
  })
  await expect(section).toBeVisible()
  // ミッション達成(2026-01-05)の方が実績解除(2026-01-01)より新しいため先に表示される
  const items = section.locator('li')
  await expect(items.first()).toContainText('🎯 ミッション達成')
  await expect(items.nth(1)).toContainText('🏆 実績解除')
})

test('統計画面: 学習カレンダーのマスをタップするとその日の内訳が表示される（④-8）', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const todayKey = `${y}-${m}-${d}`
    const history = [
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 2,
        correct: 4,
        total: 5,
        timestamp: new Date(`${todayKey}T09:00:00`).toISOString(),
      },
    ]
    window.localStorage.setItem('gyaku-fukushou:history', JSON.stringify(history))
  })
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  const todayCell = page.getByRole('button', { name: /: 1セット$/ })
  await expect(todayCell).toBeVisible()
  await todayCell.click()

  await expect(page.getByText('すうじ（逆から） Lv.2 — 4/5問正解（80%）')).toBeVisible()

  await page.getByRole('button', { name: '閉じる' }).click()
  await expect(page.getByText('すうじ（逆から） Lv.2 — 4/5問正解（80%）')).toHaveCount(0)
})

test('統計画面: 週間/月間の学習サマリーを画像で保存できる（④-4）', async ({ page }) => {
  await page.addInitScript(() => {
    const history = [
      { mode: 'digit', gameType: 'reverse', level: 2, correct: 4, total: 5, timestamp: new Date().toISOString() },
    ]
    window.localStorage.setItem('gyaku-fukushou:history', JSON.stringify(history))
  })
  await page.goto('/')
  await page.getByRole('button', { name: '統計' }).click()

  await expect(page.getByRole('heading', { name: '📸 学習サマリーを画像で保存' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '画像を保存' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^oboetore-summary-week-\d{8}\.png$/)

  await page.getByRole('button', { name: '月間' }).click()
  const monthDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '画像を保存' }).click()
  const monthDownload = await monthDownloadPromise
  expect(monthDownload.suggestedFilename()).toMatch(/^oboetore-summary-month-\d{8}\.png$/)
})
