import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { TopScreen } from './components/TopScreen'
import { LevelSelect } from './components/LevelSelect'
import { DigitTypeSelect } from './components/DigitTypeSelect'
import { DigitLevelSelect } from './components/DigitLevelSelect'
import { NBackLevelSelect } from './components/NBackLevelSelect'
import { SpatialLevelSelect } from './components/SpatialLevelSelect'
import { PatternLevelSelect } from './components/PatternLevelSelect'
import { ToneLevelSelect } from './components/ToneLevelSelect'
import { SettingsScreen } from './components/SettingsScreen'
import { StatsScreen } from './components/StatsScreen'
import { PrivacyScreen } from './components/PrivacyScreen'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useThemeMode } from './hooks/useThemeMode'
import { loadHistory } from './lib/history'
import type { AreaStats } from './lib/history'
import type { DigitGameType, HistoryEntry, Level } from './types'

// プレイ画面本体（音声合成・音声認識・出題ロジックを含む）は初回表示に
// 必要ないため、モード選択後に必要になった時点で遅延読み込みする
const GameScreen = lazy(() =>
  import('./components/GameScreen').then((m) => ({ default: m.GameScreen })),
)
const DigitGameScreen = lazy(() =>
  import('./components/DigitGameScreen').then((m) => ({
    default: m.DigitGameScreen,
  })),
)
const NBackGameScreen = lazy(() =>
  import('./components/NBackGameScreen').then((m) => ({
    default: m.NBackGameScreen,
  })),
)
const SpatialGameScreen = lazy(() =>
  import('./components/SpatialGameScreen').then((m) => ({
    default: m.SpatialGameScreen,
  })),
)
const PatternGameScreen = lazy(() =>
  import('./components/PatternGameScreen').then((m) => ({
    default: m.PatternGameScreen,
  })),
)
const ToneGameScreen = lazy(() =>
  import('./components/ToneGameScreen').then((m) => ({
    default: m.ToneGameScreen,
  })),
)

type View =
  | { screen: 'top' }
  | { screen: 'word-level' }
  | { screen: 'word-game'; level: Level }
  | { screen: 'digit-type' }
  | { screen: 'digit-level'; gameType: DigitGameType }
  | { screen: 'digit-game'; gameType: DigitGameType; level: Level }
  | { screen: 'nback-level' }
  | { screen: 'nback-game'; level: Level }
  | { screen: 'spatial-level' }
  | { screen: 'spatial-game'; level: Level }
  | { screen: 'pattern-level' }
  | { screen: 'pattern-game'; level: Level }
  | { screen: 'tone-level' }
  | { screen: 'tone-game'; level: Level }
  | { screen: 'settings' }
  | { screen: 'stats' }
  | { screen: 'privacy' }

const TOP_VIEW: View = { screen: 'top' }

// PWAマニフェストのshortcuts（ホーム画面アイコン長押し等）から
// `?shortcut=<mode>` 付きで開かれた場合に、対応するレベル選択画面へ直接遷移する
function getShortcutView(): View | null {
  if (typeof window === 'undefined') return null
  const shortcut = new URLSearchParams(window.location.search).get('shortcut')
  switch (shortcut) {
    case 'word':
      return { screen: 'word-level' }
    case 'digit':
      return { screen: 'digit-type' }
    case 'nback':
      return { screen: 'nback-level' }
    case 'spatial':
      return { screen: 'spatial-level' }
    case 'pattern':
      return { screen: 'pattern-level' }
    case 'tone':
      return { screen: 'tone-level' }
    default:
      return null
  }
}

function App() {
  const { themeMode, setThemeMode } = useThemeMode()
  const { supported: recognitionSupported } = useSpeechRecognition()
  const [view, setView] = useState<View>(() => getShortcutView() ?? TOP_VIEW)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  // スクリーンリーダー利用者が画面遷移に気づけるよう、遷移のたびに
  // メインコンテンツへフォーカスを移す（初回描画時は移さない）
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    mainRef.current?.focus()
  }, [view.screen])

  // ブラウザの戻る操作や、アプリ化した際のOS標準の戻るボタンでも画面遷移が
  // 正しく機能するよう、画面遷移を History API と連動させる。
  // 初期表示（ショートカット経由の場合も含む）の状態をここで積み直し、
  // URLの`?shortcut=...`クエリはクリーンなパスに置き換える
  useEffect(() => {
    window.history.replaceState({ view }, '', '/')
    function handlePopState(event: PopStateEvent) {
      const state = event.state as { view?: View } | null
      setView(state?.view ?? TOP_VIEW)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function goTo(next: View) {
    // 履歴を表示する画面に戻るときだけ再読み込みする（それ以外では不要な読み込みになる）
    if (
      next.screen === 'top' ||
      next.screen === 'word-level' ||
      next.screen === 'digit-level' ||
      next.screen === 'nback-level' ||
      next.screen === 'spatial-level' ||
      next.screen === 'pattern-level' ||
      next.screen === 'tone-level' ||
      next.screen === 'stats'
    ) {
      setHistory(loadHistory())
    }
    window.history.pushState({ view: next }, '')
    setView(next)
  }

  let content
  switch (view.screen) {
    case 'top':
      content = (
        <TopScreen
          history={history}
          onSelect={(mode) => {
            if (mode === 'word') goTo({ screen: 'word-level' })
            else if (mode === 'digit') goTo({ screen: 'digit-type' })
            else if (mode === 'nback') goTo({ screen: 'nback-level' })
            else if (mode === 'spatial') goTo({ screen: 'spatial-level' })
            else if (mode === 'pattern') goTo({ screen: 'pattern-level' })
            else goTo({ screen: 'tone-level' })
          }}
          onOpenSettings={() => goTo({ screen: 'settings' })}
          onOpenStats={() => goTo({ screen: 'stats' })}
          onStartRecommended={(area: AreaStats) => {
            if (area.mode === 'word') {
              goTo({ screen: 'word-game', level: area.level })
            } else if (area.mode === 'digit') {
              goTo({
                screen: 'digit-game',
                gameType: area.gameType ?? 'reverse',
                level: area.level,
              })
            } else if (area.mode === 'nback') {
              goTo({ screen: 'nback-game', level: area.level })
            } else if (area.mode === 'spatial') {
              goTo({ screen: 'spatial-game', level: area.level })
            } else if (area.mode === 'pattern') {
              goTo({ screen: 'pattern-game', level: area.level })
            } else if (area.mode === 'tone') {
              goTo({ screen: 'tone-game', level: area.level })
            }
          }}
        />
      )
      break
    case 'word-level':
      content = (
        <LevelSelect
          recognitionSupported={recognitionSupported}
          history={history}
          onSelect={(level) => goTo({ screen: 'word-game', level })}
          onBack={() => goTo({ screen: 'top' })}
        />
      )
      break
    case 'word-game':
      content = (
        <GameScreen
          key={view.level}
          level={view.level}
          onExit={() => goTo({ screen: 'word-level' })}
          onSelectLevel={(level) => goTo({ screen: 'word-game', level })}
        />
      )
      break
    case 'digit-type':
      content = (
        <DigitTypeSelect
          onSelect={(gameType) => goTo({ screen: 'digit-level', gameType })}
          onBack={() => goTo({ screen: 'top' })}
        />
      )
      break
    case 'digit-level':
      content = (
        <DigitLevelSelect
          gameType={view.gameType}
          history={history}
          onSelect={(level) =>
            goTo({ screen: 'digit-game', gameType: view.gameType, level })
          }
          onBack={() => goTo({ screen: 'digit-type' })}
        />
      )
      break
    case 'digit-game':
      content = (
        <DigitGameScreen
          key={`${view.gameType}-${view.level}`}
          level={view.level}
          gameType={view.gameType}
          onExit={() =>
            goTo({ screen: 'digit-level', gameType: view.gameType })
          }
          onSelectLevel={(level) =>
            goTo({ screen: 'digit-game', gameType: view.gameType, level })
          }
        />
      )
      break
    case 'nback-level':
      content = (
        <NBackLevelSelect
          history={history}
          onSelect={(level) => goTo({ screen: 'nback-game', level })}
          onBack={() => goTo({ screen: 'top' })}
        />
      )
      break
    case 'nback-game':
      content = (
        <NBackGameScreen
          key={view.level}
          level={view.level}
          onExit={() => goTo({ screen: 'nback-level' })}
          onSelectLevel={(level) => goTo({ screen: 'nback-game', level })}
        />
      )
      break
    case 'spatial-level':
      content = (
        <SpatialLevelSelect
          history={history}
          onSelect={(level) => goTo({ screen: 'spatial-game', level })}
          onBack={() => goTo({ screen: 'top' })}
        />
      )
      break
    case 'spatial-game':
      content = (
        <SpatialGameScreen
          key={view.level}
          level={view.level}
          onExit={() => goTo({ screen: 'spatial-level' })}
          onSelectLevel={(level) => goTo({ screen: 'spatial-game', level })}
        />
      )
      break
    case 'pattern-level':
      content = (
        <PatternLevelSelect
          history={history}
          onSelect={(level) => goTo({ screen: 'pattern-game', level })}
          onBack={() => goTo({ screen: 'top' })}
        />
      )
      break
    case 'pattern-game':
      content = (
        <PatternGameScreen
          key={view.level}
          level={view.level}
          onExit={() => goTo({ screen: 'pattern-level' })}
          onSelectLevel={(level) => goTo({ screen: 'pattern-game', level })}
        />
      )
      break
    case 'tone-level':
      content = (
        <ToneLevelSelect
          history={history}
          onSelect={(level) => goTo({ screen: 'tone-game', level })}
          onBack={() => goTo({ screen: 'top' })}
        />
      )
      break
    case 'tone-game':
      content = (
        <ToneGameScreen
          key={view.level}
          level={view.level}
          onExit={() => goTo({ screen: 'tone-level' })}
          onSelectLevel={(level) => goTo({ screen: 'tone-game', level })}
        />
      )
      break
    case 'settings':
      content = (
        <SettingsScreen
          themeMode={themeMode}
          onChangeTheme={setThemeMode}
          onBack={() => goTo({ screen: 'top' })}
          onOpenPrivacy={() => goTo({ screen: 'privacy' })}
        />
      )
      break
    case 'stats':
      content = (
        <StatsScreen history={history} onBack={() => goTo({ screen: 'top' })} />
      )
      break
    case 'privacy':
      content = (
        <PrivacyScreen onBack={() => goTo({ screen: 'settings' })} />
      )
      break
  }

  return (
    <main
      ref={mainRef}
      tabIndex={-1}
      className="relative min-h-full overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-fuchsia-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] outline-none dark:from-gray-950 dark:via-indigo-950 dark:to-gray-900"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-600/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-600/15"
      />
      <div className="relative">
        <Suspense
          fallback={
            <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              読み込み中…
            </p>
          }
        >
          {content}
        </Suspense>
      </div>
    </main>
  )
}

export default App
