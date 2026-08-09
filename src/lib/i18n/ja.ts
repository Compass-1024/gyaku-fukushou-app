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
    pauseButton: '⏸ 一時停止',
    pausedMessage: '一時停止中です。準備ができたら再開してください',
    resumeButton: '▶ 再開する',
    areaLabels: {
      word: 'ことば',
      'digit-reverse': 'すうじ（逆から）',
      'digit-sum': 'すうじ（合計）',
      nback: 'Nバック',
      'dual-nback': 'デュアルNバック',
      spatial: '空間',
      pattern: '変化検出',
      tone: '音・色の順番',
      random: 'ランダム',
    },
  },
  top: {
    heading: 'ワーキングメモリトレーニング',
    subtitle: '9種類のトレーニングで、脳のワーキングメモリを鍛えましょう',
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
        description: '言葉を逆から答える',
      },
      digitReverse: {
        title: 'すうじモード（逆から入力）',
        description: '数字を逆から入力',
      },
      digitSum: {
        title: 'すうじモード（合計を入力）',
        description: '数字の合計を入力',
      },
      nback: {
        title: 'Nバックモード',
        description: 'N個前の位置を判定',
      },
      spatial: {
        title: '空間モード',
        description: '逆順にマスをタップ',
      },
      pattern: {
        title: '変化検出モード',
        description: '模様の変化を発見',
      },
      tone: {
        title: '音・色モード',
        description: '音の順番を再現',
      },
      dualNback: {
        title: 'デュアルNバックモード',
        description: '位置と音を判定',
      },
      random: {
        title: 'ランダムモード',
        description: '5モードを一気に',
      },
    },
    playerLevel: (level) => `プレイヤーLv.${level}`,
    xpToNextLevel: (xp) => `次のレベルまで あと${xp}XP`,
    growingBadgeLabel: '正答率が向上中',
  },
  missions: {
    cardTitle: '🎯 今日のミッション',
    completedBadge: '✅ 達成しました！',
    xpReward: (xp) => `達成で +${xp}XP`,
    playCountLabel: (areaLabel, count) => `${areaLabel}を${count}回プレイ`,
    accuracyLabel: (percent) => `正答率${percent}%以上を達成`,
    chipLabel: 'ミッション',
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
    xpGainedZero: '今回の獲得XPはなし。次は1つ正解を目指そう',
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
    sfxTestButton: '🔊 テスト再生',
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
    calendarCaption: '色が濃いほど、その日に完了したセット数が多いことを表します',
    calendarSummary: (weeks, activeDays) =>
      `直近${weeks}週間で${activeDays}日学習`,
    calendarAriaLabel: (weeks, activeDays) =>
      `直近${weeks}週間の学習カレンダー。学習した日数は${activeDays}日`,
    calendarLegendLow: '少ない',
    calendarLegendHigh: '多い',
    calendarLegendCount: (count) => (count >= 3 ? '3+' : `${count}`),
    weekdayLabels: ['日', '月', '火', '水', '木', '金', '土'],
    monthLabels: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ],
    dayCellTooltip: (dateKey, count) => `${dateKey}: ${count}セット`,
    trendTitle: (days) => `正答率の推移（直近${days}日間）`,
    trendAriaLabel: (days) => `直近${days}日間の正答率の推移`,
    trendNoRecord: (dateKey) => `${dateKey}: 記録なし`,
    trendDaysAgo: (days) => `${days}日前`,
    trendToday: '今日',
    achievementsTitle: '実績',
    achievementsCountLabel: (unlocked, total) => `${unlocked} / ${total} 解除`,
    achievementUnlocked: '解除済み',
    achievementLocked: '未解除',
    achievementCloseDetail: '閉じる',
    areaAccuracyTitle: 'モード別の正答率',
    areaLabel: (label, level) => `${label} レベル${level}`,
    needsReview: '⚠️ 要復習',
    accuracySummary: (accuracyPercent, attempts) =>
      `${accuracyPercent}%（${attempts}回）`,
    notAttempted: '未挑戦',
    weakPhrasesTitle: 'ことばモード: 苦手なフレーズ',
    weakPhraseStat: (accuracyPercent, total, correct) =>
      `${accuracyPercent}%（${total}回中${correct}回正解）`,
    bucketWeaknessLabels: {
      'digit:repeat': '同じ数字が重複する問題',
      'digit:unique': '数字がすべて異なる問題',
      'spatial:adjacent': '隣のマスへ連続して移動する問題',
      'spatial:scattered': '離れたマスへ飛ぶ問題',
      'pattern:clustered': 'マスがかたまって並ぶ模様',
      'pattern:scattered': 'マスが散らばって並ぶ模様',
      'tone:repeat': '同じパッドが重複する問題',
      'tone:unique': 'パッドがすべて異なる問題',
    },
    bucketWeaknessSummary: (label, accuracyPercent) =>
      `${label}が苦手（正答率${accuracyPercent}%）`,
    modeTrendTitle: 'モード別の正答率推移',
    modeTrendNotEnoughData: '挑戦回数が増えると表示されます',
  },
  dailyChallenge: {
    title: '🎯 本日のお題',
    description: '今日だけの数字4桁。逆から入力できるか挑戦しよう（1日1回）',
    startButton: '挑戦する',
    rememberPrompt: 'よく覚えてください',
    inputPrompt: '逆から入力してください',
    completedBadge: (correct) => (correct ? '✅ 今日は正解済み' : '📝 今日は挑戦済み'),
    chipLabel: 'お題',
  },
  program: {
    title: '🗓️ 7日間チャレンジ',
    progressLabel: (daysPlayed, totalDays) =>
      `直近7日間で ${daysPlayed} / ${totalDays} 日プレイ`,
    completeMessage: '🎉 7日間すべてでプレイ達成！この調子で続けよう',
    chipLabel: '7日間',
    chipProgress: (daysPlayed, totalDays) => `${daysPlayed}/${totalDays}日`,
  },
  onboarding: {
    steps: [
      {
        title: 'ようこそ！',
        body: '逆復唱トレーニングは、9種類のミニゲームでワーキングメモリ（作業記憶）を鍛えるアプリです。',
      },
      {
        title: '遊び方はシンプル',
        body: 'レベルを選んで出題を見る（聞く）→覚えた通りに答える、の繰り返し。1セットは数分で終わります。',
      },
      {
        title: '続けるほど育つ',
        body: '正解でXPを獲得してプレイヤーLvが上がり、実績やストリークも記録されます。まずは1つ試してみましょう！',
      },
    ],
    next: '次へ',
    skip: 'スキップ',
    start: 'はじめる',
    stepProgress: (current, total) => `${current} / ${total}`,
  },
  installBanner: {
    title: '📲 ホーム画面に追加しませんか？',
    body: 'アプリのように起動でき、リマインド通知も届きやすくなります',
    installButton: 'ホーム画面に追加',
    iosBody:
      '📲 共有ボタン（□に↑）から「ホーム画面に追加」を選ぶと、アプリのように起動できます',
    dismiss: '閉じる',
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
    'level-3-dual-nback': {
      label: 'デュアルNバック上級者',
      description: 'デュアルNバックモードのレベル3に挑戦した',
    },
    'total-10': { label: '継続力', description: '累計10セットを完了した' },
    'total-50': { label: '継続力（上級）', description: '累計50セットを完了した' },
    'growing-strong': {
      label: '成長中',
      description: '「ワーキングメモリの伸び」で2つ以上のモードが向上中と判定された',
    },
    'all-modes': { label: 'オールラウンダー', description: '全モードに挑戦した' },
    'all-six-modes': {
      label: '全モード制覇',
      description: 'ことば・すうじ・Nバック・空間・変化検出・音の全6モードに挑戦した',
    },
    'all-eight-modes': {
      label: 'コンプリート',
      description: 'デュアルNバック・ランダムを含む全8モードに挑戦した',
    },
    'all-modes-mastered': {
      label: '全モードマスター',
      description: '全8モードでレベル3に挑戦した',
    },
    'player-level-5': {
      label: '駆け出しトレーナー',
      description: 'プレイヤーLv.5に到達した',
    },
    'player-level-10': {
      label: '熟練トレーナー',
      description: 'プレイヤーLv.10に到達した',
    },
    'player-level-20': {
      label: 'マスタートレーナー',
      description: 'プレイヤーLv.20に到達した',
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
  nback: {
    title: 'Nバックモード',
    subtitle:
      '3×3マスのどこかが1つずつ光ります。N個前と同じ位置なら「一致」を押すワーキングメモリトレーニングです。',
    levelLabel: (level) =>
      (
        {
          1: 'レベル1（1つ前と比較）',
          2: 'レベル2（2つ前と比較）',
          3: 'レベル3（3つ前と比較）',
        } as const
      )[level],
    trialCountTitle: '出題数',
    trialCountLabel: (count) => `${count}問`,
    matchPrompt: (n) => `${n}個前と同じ位置なら「一致」を押してください`,
    matchButton: '一致',
    matchButtonPressed: '✓ 一致',
    resultLabel: (position, isMatch) =>
      isMatch ? `位置${position + 1}（一致）` : `位置${position + 1}`,
    adaptiveLabel: 'アダプティブ（おすすめ）',
    adaptiveDescription:
      '正解が続くとN値が自動で上がり、間違いが続くと下がります。今の実力に合わせて挑戦したい方に',
    currentNLabel: (n) => `現在: ${n}個前`,
    maxNReachedLabel: (n) => `到達した最大N: ${n}個前`,
  },
  dualNback: {
    title: 'デュアルNバックモード',
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
    trialCountTitle: '出題数',
    trialCountLabel: (count) => `${count}問`,
    matchPrompt: (n) => `${n}個前と同じなら該当ボタンを押してください`,
    positionMatchButton: '位置一致',
    positionMatchButtonPressed: '✓ 位置一致',
    soundMatchButton: '音一致',
    soundMatchButtonPressed: '✓ 音一致',
    resultLabel: (channel, isMatch) =>
      `${channel === 'position' ? '位置' : '音'}${isMatch ? '（一致）' : ''}`,
    adaptiveLabel: 'アダプティブ（おすすめ）',
    adaptiveDescription:
      '位置・音の両方が正解し続けるとN値が自動で上がり、間違いが続くと下がります',
    currentNLabel: (n) => `現在: ${n}個前`,
    maxNReachedLabel: (n) => `到達した最大N: ${n}個前`,
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
      'すうじ（逆から/合計）・空間・変化検出・音/色の中から1問ずつ、合計5問がランダムな順番で出題されます。',
    levelLabel: (level) =>
      ({ 1: 'レベル1', 2: 'レベル2', 3: 'レベル3' })[level],
    roundProgress: (current, total) => `問題 ${current} / ${total}`,
    resultLabel: (correct, total) => `${correct} / ${total} 問正解`,
    weakPointFocusLabel: '弱点重視',
    weakPointFocusDescription:
      'オンにすると、各ラウンドのレベルを一律ではなく、モードごとに最も正答率が低いレベルへ自動で合わせます',
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
    title: 'ワーキングメモリの伸び',
    disclaimer:
      'この目安は、一般的な心理学的基準ではなく、あなた自身のこれまでの挑戦履歴を前半・後半に分けて正答率を比較したものです。挑戦回数が十分に増えると内容が更新されます。医学的な診断や公式な認知機能評価ではなく、参考程度にご覧ください。',
    bandLabels: {
      below: '低下ぎみ',
      average: '横ばい',
      above: '向上中',
    },
    recentLabel: (accuracyPercent) => `直近の正答率: ${accuracyPercent}%`,
    previousLabel: (accuracyPercent) => `以前の正答率: ${accuracyPercent}%`,
    digit: { label: 'すうじモード（逆から入力）' },
    'digit-sum': { label: 'すうじモード（合計を入力）' },
    spatial: { label: '空間モード' },
    nback: { label: 'Nバックモード' },
    pattern: { label: '変化検出モード' },
    'dual-nback': { label: 'デュアルNバックモード' },
    random: { label: 'ランダムモード' },
    word: { label: 'ことばモード' },
    tone: { label: '音・色モード' },
  },
}
