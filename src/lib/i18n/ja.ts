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
    seeResults: '結果を見る',
    next: '次へ',
    backToModeSelect: '← モード選択',
    backToLevelSelect: '← レベル選択',
    suggestionUp: (levelLabel) => `🎉 ${levelLabel}に挑戦する`,
    suggestionDown: (levelLabel) => `${levelLabel}に戻って練習する`,
    rememberPrompt: 'よく覚えてください',
    correctAnswerLabel: '正しい答え: ',
    correctOrderLabel: '正しい順番: ',
    yourAnswerLabel: 'あなたの回答: ',
    noAnswer: '（未回答）',
    confirmExitMessage: '回答中のセットが破棄されます。よろしいですか？',
    questionProgress: (current, total) => `問題 ${current} / ${total}`,
    attemptStats: (accuracyPercent, attempts) =>
      `これまでの正答率: ${accuracyPercent}%（${attempts}回挑戦）`,
    areaLabels: {
      word: 'ことば',
      'digit-reverse': 'すうじ（逆から）',
      'digit-sum': 'すうじ（合計）',
      sequence: '順唱',
      nback: 'Nバック',
      'dual-nback': 'Dual N-Back',
      spatial: '空間',
      pattern: '変化検出',
      tone: '音・色の順番',
      random: 'ランダム',
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
      sequence: {
        title: '順唱モード',
        description:
          '表示された数字を見た順番のまま入力するワーキングメモリトレーニングです。',
      },
      dualNback: {
        title: 'Dual N-Backモード',
        description:
          'マスの位置と音を同時に覚え、それぞれN個前と一致するかを別々に判定する高難度トレーニングです。',
      },
      random: {
        title: 'ランダムモード',
        description:
          'すうじ・順唱・空間・変化検出・音/色の中からランダムに5問出題される、ミックス練習モードです。',
      },
    },
    playerLevel: (level) => `プレイヤーLv.${level}`,
    xpToNextLevel: (xp) => `次のレベルまで あと${xp}XP`,
  },
  missions: {
    cardTitle: '🎯 今日のミッション',
    completedBadge: '✅ 達成しました！',
    xpReward: (xp) => `達成で +${xp}XP`,
    playCountLabel: (areaLabel, count) => `${areaLabel}を${count}回プレイ`,
    accuracyLabel: (percent) => `正答率${percent}%以上を達成`,
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
    xpGained: (xp) => `獲得XP: +${xp}`,
    levelUp: (level) => `🎉 Level Up! プレイヤーLv.${level}`,
  },
  settings: {
    heading: '設定',
    theme: {
      title: 'テーマ',
      system: 'システム',
      light: 'ライト',
      dark: 'ダーク',
    },
    language: {
      title: '言語',
      ja: '日本語',
      en: 'English',
    },
    dailyGoalTitle: '1日の目標セット数',
    soundTitle: '効果音',
    on: 'オン',
    off: 'オフ',
    sfxVolumeTitle: '効果音の音量',
    bgmTitle: 'BGM',
    bgmVolumeTitle: 'BGMの音量',
    notifications: {
      title: 'リマインド通知',
      unsupported:
        'この端末・ブラウザは通知に対応していません（iOSはホーム画面に追加したアプリのみ対応しています）。',
      supportedDescription:
        'その日にまだ1回もプレイしていない場合、毎日21時ごろにリマインドを送ります（送信時刻は前後する場合があります）。',
      permissionDenied:
        '通知の使用が許可されていません。ブラウザの設定で通知への許可を有効にしてください。',
      genericError:
        '通知の設定に失敗しました。時間をおいて再度お試しください。改善しない場合は、パソコン・スマートフォン本体側の通知設定（OSの設定アプリ）でこのブラウザの通知が許可されているかもご確認ください。',
      unsupportedResult: 'この端末・ブラウザは通知に対応していません。',
    },
    data: {
      title: 'データ',
      description:
        '学習履歴・実績・設定はこの端末のブラウザ内にのみ保存されています。機種変更やブラウザデータの削除に備えて、定期的にバックアップすることをおすすめします。',
      exportButton: '⬇️ バックアップを書き出す',
      importButton: '⬆️ バックアップから復元',
      clearHistoryButton: '学習履歴をすべて削除',
      clearHistoryConfirm:
        '学習履歴・統計・実績をすべて削除します。この操作は取り消せません。よろしいですか？',
      clearedMessage: '削除しました。トップ画面に戻ると反映されます。',
      importConfirm: (historyCount) =>
        `現在の学習履歴・設定を、バックアップファイルの内容（履歴${historyCount}件）で上書きします。この操作は取り消せません。よろしいですか？`,
      importSuccess: 'インポートしました。トップ画面に戻ると反映されます。',
      importErrors: {
        'invalid-json':
          'ファイルの形式が正しくありません（JSONとして読み込めませんでした）',
        'invalid-content': 'ファイルの内容が正しくありません',
        'invalid-history':
          '学習履歴のデータ形式が正しくありません。別のファイルをお試しください',
        'invalid-settings':
          '設定のデータ形式が正しくありません。別のファイルをお試しください',
      },
    },
  },
  stats: {
    heading: '統計',
    noRecordsYet: 'まだ記録がありません。プレイすると統計が表示されます。',
    calendarTitle: '学習カレンダー',
    calendarSummary: (weeks, activeDays) =>
      `直近${weeks}週間で${activeDays}日学習`,
    calendarAriaLabel: (weeks, activeDays) =>
      `直近${weeks}週間の学習カレンダー。学習した日数は${activeDays}日`,
    calendarLegendLow: '少ない',
    calendarLegendHigh: '多い',
    weekdayLabels: ['日', '月', '火', '水', '木', '金', '土'],
    dayCellTooltip: (dateKey, count) => `${dateKey}: ${count}セット`,
    trendTitle: (days) => `正答率の推移（直近${days}日間）`,
    trendAriaLabel: (days) => `直近${days}日間の正答率の推移`,
    trendNoRecord: (dateKey) => `${dateKey}: 記録なし`,
    trendDaysAgo: (days) => `${days}日前`,
    trendToday: '今日',
    achievementsTitle: '実績',
    achievementUnlocked: '解除済み',
    achievementLocked: '未解除',
    areaAccuracyTitle: 'モード別の正答率',
    areaLabel: (label, level) => `${label} レベル${level}`,
    needsReview: '⚠️ 要復習',
    accuracySummary: (accuracyPercent, attempts) =>
      `${accuracyPercent}%（${attempts}回）`,
    notAttempted: '未挑戦',
    weakPhrasesTitle: 'ことばモード: 苦手なフレーズ',
    weakPhraseStat: (accuracyPercent, total, correct) =>
      `${accuracyPercent}%（${total}回中${correct}回正解）`,
  },
  privacy: {
    heading: 'プライバシーポリシー',
    dataLocationTitle: 'データの保存先',
    dataLocationBody:
      '本アプリの大部分の機能はサーバーを持たず、トレーニング履歴やアプリ設定はすべてお使いの端末のブラウザ（localStorage）にのみ保存されます。運営者を含む第三者にデータが送信されることはありません（「リマインド通知」をオンにした場合を除く。下記参照）。',
    notificationsTitle: 'リマインド通知について',
    notificationsBody:
      '「設定」画面の「リマインド通知」は既定でオフのオプトイン機能です。オンにすると、その日プレイしたかどうか・UI言語設定（通知メッセージの言語切り替えに使用）・プッシュ購読情報が本アプリのサーバー（Vercel Serverless Functions）へ送信されます。トレーニング履歴の内容そのものは送信されません。オフに戻せばサーバー側の情報も削除されます。',
    micTitle: 'マイク（音声）について',
    micBody:
      '「ことばモード」では、ブラウザの音声認識機能（Web Speech API）を利用して復唱内容を判定します。本アプリ自体が音声データを収集・保存することはありませんが、ブラウザによっては音声データがブラウザベンダーのサーバーで処理される場合があります（ブラウザの仕様によるものです）。',
    cookieTitle: 'Cookie・アクセス解析',
    cookieBody: 'Cookieやアクセス解析ツール、広告トラッキングは使用していません。',
    deletionTitle: 'データの削除',
    deletionBody:
      '「設定」画面の「学習履歴をすべて削除」から一括削除できます。また、ブラウザの設定からサイトデータ（localStorage）を削除する方法でも同様に消去できます。',
    backupBody:
      '「設定」画面の「バックアップを書き出す」から、保存されている全データ（トレーニング履歴・アプリ設定）をJSONファイルとして端末にダウンロードできます。同画面の「バックアップから復元」で、書き出したファイルを別の端末・ブラウザに読み込ませることも可能です（現在保存されているデータは上書きされます）。',
    contactTitle: 'お問い合わせ',
    contactBody: 'お問い合わせ窓口は現在準備中です。',
    summaryNotice: 'このページは要約です。詳細な内容は',
    fullPolicyLink: 'プライバシーポリシー全文',
    fullPolicyLinkSuffix: 'を参照してください。',
  },
  achievements: {
    'first-session': { label: 'はじめの一歩', description: '初めて1セットを完了した' },
    'perfect-score': { label: 'パーフェクト', description: '1セットで全問正解した' },
    'streak-3': { label: '3日坊主卒業', description: '3日連続で挑戦した' },
    'streak-7': { label: '継続は力なり', description: '7日連続で挑戦した' },
    'streak-30': { label: '猛者', description: '30日連続で挑戦した' },
    'level-3-word': {
      label: 'ことば上級者',
      description: 'ことばモードのレベル3に挑戦した',
    },
    'level-3-digit': {
      label: 'すうじ上級者',
      description: 'すうじモードのレベル3に挑戦した',
    },
    'level-3-nback': {
      label: 'Nバック上級者',
      description: 'Nバックモードのレベル3に挑戦した',
    },
    'level-3-spatial': {
      label: '空間記憶上級者',
      description: '空間モードのレベル3に挑戦した',
    },
    'level-3-pattern': {
      label: '観察力上級者',
      description: '変化検出モードのレベル3に挑戦した',
    },
    'level-3-tone': {
      label: '音感上級者',
      description: '音・色モードのレベル3に挑戦した',
    },
    'level-3-sequence': {
      label: '順唱上級者',
      description: '順唱モードのレベル3に挑戦した',
    },
    'level-3-dual-nback': {
      label: 'Dual N-Back上級者',
      description: 'Dual N-Backモードのレベル3に挑戦した',
    },
    'total-10': { label: '継続力', description: '累計10セットを完了した' },
    'total-50': { label: '継続力（上級）', description: '累計50セットを完了した' },
    'all-modes': { label: 'オールラウンダー', description: '全モードに挑戦した' },
    'all-six-modes': {
      label: '全モード制覇',
      description: 'ことば・すうじ・Nバック・空間・変化検出・音の全6モードに挑戦した',
    },
    'all-nine-modes': {
      label: 'コンプリート',
      description: '順唱・Dual N-Back・ランダムを含む全9モードに挑戦した',
    },
  },
  digit: {
    title: 'すうじモード',
    subtitle: '表示された数字を覚えて答えるワーキングメモリトレーニングです。',
    gameTypes: {
      reverse: {
        title: '逆から入力',
        description: '表示された数字を逆の順番で入力しましょう',
      },
      sum: {
        title: '合計を入力',
        description: '表示された数字をすべて足した合計を入力しましょう',
      },
    },
    backToTypeSelect: '← すうじモード選択',
    levelSelectTitle: (gameTypeTitle) => `すうじモード（${gameTypeTitle}）`,
    levelLabel: (level) =>
      ({ 1: 'レベル1（3桁）', 2: 'レベル2（5桁）', 3: 'レベル3（7桁）' })[level],
    answerPrompt: {
      reverse: '逆から入力してください',
      sum: '全部たすといくつ？',
    },
    noInput: '（未入力）',
    questionLabel: '出題: ',
  },
  sequence: {
    title: '順唱モード',
    subtitle: '表示された数字を、見た順番のまま入力するワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      ({ 1: 'レベル1（3桁）', 2: 'レベル2（5桁）', 3: 'レベル3（7桁）' })[level],
    answerPrompt: '見た順番のまま入力してください',
    noInput: '（未入力）',
    questionLabel: '出題: ',
  },
  nback: {
    title: 'Nバックモード',
    subtitle:
      '数字が1つずつ表示されます。N個前と同じ数字なら「一致」を押すワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      (
        {
          1: 'レベル1（1つ前と比較）',
          2: 'レベル2（2つ前と比較）',
          3: 'レベル3（3つ前と比較）',
        } as const
      )[level],
    matchPrompt: (n) => `${n}個前と同じなら「一致」を押してください`,
    matchButton: '一致',
    matchButtonPressed: '✓ 一致',
    resultLabel: (digit, isMatch) => (isMatch ? `${digit}（一致）` : `${digit}`),
  },
  dualNback: {
    title: 'Dual N-Backモード',
    subtitle:
      'マスの位置と音が同時に提示されます。N個前と位置が同じなら「位置一致」、音が同じなら「音一致」を押すワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      (
        {
          1: 'レベル1（1つ前と比較）',
          2: 'レベル2（2つ前と比較）',
          3: 'レベル3（3つ前と比較）',
        } as const
      )[level],
    matchPrompt: (n) => `${n}個前と同じなら該当ボタンを押してください`,
    positionMatchButton: '位置一致',
    positionMatchButtonPressed: '✓ 位置一致',
    soundMatchButton: '音一致',
    soundMatchButtonPressed: '✓ 音一致',
    resultLabel: (channel, isMatch) =>
      `${channel === 'position' ? '位置' : '音'}${isMatch ? '（一致）' : ''}`,
  },
  spatial: {
    title: '空間モード',
    subtitle:
      'マスが光る順番を覚えて、逆から画面をタップして答えるワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      (
        {
          1: 'レベル1（3×3・3マス）',
          2: 'レベル2（3×3・4マス）',
          3: 'レベル3（4×4・5マス）',
        } as const
      )[level],
    answerPrompt: '逆の順番でマスをタップしてください',
    litSquaresAriaLabel: '光る順番を覚えてください',
    cellAriaLabel: (index, tapOrder) =>
      `マス${index}${tapOrder !== null ? `（${tapOrder}番目にタップ）` : ''}`,
    resultLabel: (cellCount) => `${cellCount}マス`,
  },
  pattern: {
    title: '変化検出モード',
    subtitle:
      '一瞬表示される模様を覚えて、もう一度見せたときに変化しているかどうかを見分けるワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      (
        {
          1: 'レベル1（4×4・4マス）',
          2: 'レベル2（4×4・6マス）',
          3: 'レベル3（5×5・8マス）',
        } as const
      )[level],
    selectPrompt: 'さっき青色だったマスをすべて選んでください',
    submitButton: '回答する',
    cellAriaLabel: (index, selected) =>
      `マス${index}${selected ? '（選択中）' : ''}`,
  },
  random: {
    title: 'ランダムモード',
    subtitle:
      'すうじ・順唱・空間・変化検出・音/色の中から1問ずつ、合計5問がランダムな順番で出題されます。',
    levelLabel: (level) =>
      ({ 1: 'レベル1', 2: 'レベル2', 3: 'レベル3' })[level],
    roundProgress: (current, total) => `問題 ${current} / ${total}`,
    resultLabel: (correct, total) => `${correct} / ${total} 問正解`,
  },
  tone: {
    title: '音・色モード',
    subtitle:
      '色のパッドが音とともに光る順番を覚えて、同じ順にタップして再現するワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      ({ 1: 'レベル1（3音）', 2: 'レベル2（4音）', 3: 'レベル3（5音）' })[level],
    answerPrompt: '同じ順番でパッドをタップしてください',
    padColors: ['赤', '青', '緑', '黄'],
    padAriaLabel: (color) => `${color}のパッド`,
    resultLabel: (padCount) => `${padCount}音`,
  },
  benchmarks: {
    title: 'ワーキングメモリの目安',
    disclaimer:
      'この目安は、各モードに対応する心理学の課題（逆唱スパン・視空間スパン・Nバック・視覚ワーキングメモリ容量）について一般的に知られている大まかな範囲と比較したものです。医学的な診断や公式な認知機能評価ではなく、個人差や体調によっても変動します。参考程度にご覧ください。',
    bandLabels: {
      below: '目安より低め',
      average: '目安の範囲内',
      above: '目安より高め',
    },
    digit: {
      label: '逆唱スパン（すうじモード・逆から入力）',
      valueLabel: (digits) => `${digits}桁`,
      referenceLabel: (min, max) => `一般的な目安: ${min}〜${max}桁`,
    },
    sequence: {
      label: '順唱スパン（順唱モード）',
      valueLabel: (digits) => `${digits}桁`,
      referenceLabel: (min, max) => `一般的な目安: ${min}〜${max}桁`,
    },
    spatial: {
      label: '視空間スパン（空間モード）',
      valueLabel: (cells) => `${cells}マス`,
      referenceLabel: (min, max) => `一般的な目安: ${min}〜${max}マス`,
    },
    nback: {
      label: 'Nバック正答率',
      valueLabel: (accuracyPercent) => `${accuracyPercent}%`,
      referenceLabel: (min, max) => `一般的な目安: ${min}〜${max}%`,
    },
    pattern: {
      label: '視覚ワーキングメモリ容量（変化検出モード）',
      valueLabel: (k) => `${k}マス`,
      referenceLabel: (min, max) => `一般的な目安: ${min}〜${max}マス`,
    },
  },
}
