import { useEffect, useRef, useState } from 'react'
import { TopScreen } from './components/TopScreen'
import { LevelSelect } from './components/LevelSelect'
import { GameScreen } from './components/GameScreen'
import { DigitTypeSelect } from './components/DigitTypeSelect'
import { DigitLevelSelect } from './components/DigitLevelSelect'
import { DigitGameScreen } from './components/DigitGameScreen'
import { NBackLevelSelect } from './components/NBackLevelSelect'
import { NBackGameScreen } from './components/NBackGameScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { StatsScreen } from './components/StatsScreen'
import { PrivacyScreen } from './components/PrivacyScreen'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useThemeMode } from './hooks/useThemeMode'
import { loadHistory } from './lib/history'
import type { DigitGameType, HistoryEntry, Level } from './types'

type View =
  | { screen: 'top' }
  | { screen: 'word-level' }
  | { screen: 'word-game'; level: Level }
  | { screen: 'digit-type' }
  | { screen: 'digit-level'; gameType: DigitGameType }
  | { screen: 'digit-game'; gameType: DigitGameType; level: Level }
  | { screen: 'nback-level' }
  | { screen: 'nback-game'; level: Level }
  | { screen: 'settings' }
  | { screen: 'stats' }
  | { screen: 'privacy' }

const TOP_VIEW: View = { screen: 'top' }

function App() {
  const { themeMode, setThemeMode } = useThemeMode()
  const { supported: recognitionSupported } = useSpeechRecognition()
  const [view, setView] = useState<View>(TOP_VIEW)
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
  // 正しく機能するよう、画面遷移を History API と連動させる
  useEffect(() => {
    window.history.replaceState({ view: TOP_VIEW }, '')
    function handlePopState(event: PopStateEvent) {
      const state = event.state as { view?: View } | null
      setView(state?.view ?? TOP_VIEW)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function goTo(next: View) {
    // 履歴を表示する画面に戻るときだけ再読み込みする（それ以外では不要な読み込みになる）
    if (
      next.screen === 'top' ||
      next.screen === 'word-level' ||
      next.screen === 'digit-level' ||
      next.screen === 'nback-level' ||
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
            else goTo({ screen: 'nback-level' })
          }}
          onOpenSettings={() => goTo({ screen: 'settings' })}
          onOpenStats={() => goTo({ screen: 'stats' })}
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
      <div className="relative">{content}</div>
    </main>
  )
}

export default App
