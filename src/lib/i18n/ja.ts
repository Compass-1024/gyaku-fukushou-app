import { JA_SHARE_TEMPLATES } from '../share'
import type { Translations } from './types'

export const ja: Translations = {
  common: {
    back: '← 戻る',
    loading: '読み込み中…',
    stats: '統計',
    settings: '設定',
    privacyPolicy: 'プライバシーポリシー',
    correct: '正解',
    incorrect: '不正解',
    confirm: '決定',
    deleteChar: '1文字削除',
    questionProgress: (current, total) => `問題 ${current} / ${total}`,
    attemptStats: (accuracyPercent, attempts) =>
      `これまでの正答率: ${accuracyPercent}%（${attempts}回挑戦）`,
    areaLabels: {
      word: 'ことば',
      'digit-reverse': 'すうじ（逆から）',
      'digit-sum': 'すうじ（合計）',
      nback: 'Nバック',
      spatial: '空間',
      pattern: '変化検出',
      tone: '音・色の順番',
    },
  },
  top: {
    heading: 'ワーキングメモリトレーニング',
    subtitle: '聞いたり見たりしたものを、逆から答えて脳を鍛えましょう',
    streakDays: (days) => `🔥 ${days}日連続`,
    todayCount: (count) => `今日 ${count}回挑戦`,
    dailyGoal: (today, goal) => `今日の目標: ${today} / ${goal} セット`,
    streakAtRisk: (days) =>
      `🔥 ${days}日連続中！今日プレイしないと記録が途切れます。`,
    dismissRecap: '振り返りを閉じる',
    recapTitle: '📅 先週の振り返り',
    recapSummary: (sets, accuracyPercent) =>
      `${sets}セット完了${accuracyPercent !== null ? `、正答率${accuracyPercent}%` : ''}でした`,
    recapIncrease: (previousWeekSets) =>
      `📈 前々週（${previousWeekSets}セット）より増えています！`,
    recapDecrease: (previousWeekSets) =>
      `前々週は${previousWeekSets}セットでした。無理のないペースで続けましょう`,
    recapSame: '前々週と同じペースです',
    recommendedTitle: '🎯 今日のおすすめ',
    recommendedSummary: (areaLabel, accuracyPercent) =>
      `${areaLabel}（正答率${accuracyPercent}%）を復習しましょう`,
    modes: {
      word: {
        title: 'ことばモード',
        description:
          '言葉を聞いて、逆から声に出して答えるワーキングメモリトレーニングです。',
      },
      digit: {
        title: 'すうじモード',
        description:
          '表示された数字を逆の順番で入力するワーキングメモリトレーニングです。',
      },
      nback: {
        title: 'Nバックモード',
        description:
          'N個前と同じ数字が出たら反応する、科学的根拠のあるワーキングメモリトレーニングです。',
      },
      spatial: {
        title: '空間モード',
        description:
          'マスが光る順番を覚えて、逆から画面をタップして答える視空間ワーキングメモリトレーニングです。',
      },
      pattern: {
        title: '変化検出モード',
        description:
          '一瞬表示される模様を覚えて、変化したかどうかを見分けるワーキングメモリトレーニングです。',
      },
      tone: {
        title: '音・色モード',
        description:
          '色のパッドが音とともに光る順番を覚えて、同じ順にタップして再現する非言語性のワーキングメモリトレーニングです。',
      },
    },
  },
  share: JA_SHARE_TEMPLATES,
  setSummary: {
    resultLabel: '結果',
    scoreLabel: (correct, total) => `${correct} / ${total} 問正解`,
    shareButton: '📤 結果をシェア',
    shareStatusShared: 'シェアしました',
    shareStatusCopied: 'クリップボードにコピーしました',
    shareStatusError:
      'シェアに対応していない環境です。テキストを選択してコピーしてください。',
    luckyBonus: '🍀 ラッキーデー！ たまたま今日は運が良いようです',
    newBest: '🏅 自己ベスト更新！',
    newAchievementsTitle: '🎉 新しい実績を獲得しました！',
    questionLabel: (index) => `問題${index}: `,
    dailyGoal: (today, goal) => `今日の目標: ${today} / ${goal} セット`,
    dailyGoalReached: '🎉 今日の目標セット数を達成しました！',
    retry: '同じレベルでもう一度',
    changeLevel: 'レベル選択に戻る',
  },
}
