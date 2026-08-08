# Changelog

このプロジェクトの変更履歴。[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)の形式に準拠する。

## [Unreleased]

### Security

- 通知API（`api/push/subscribe.ts`・`sync.ts`・`unsubscribe.ts`）に匿名POSTの大量リクエストによるコストDoSを防ぐレート制限を追加（`api/_lib/rateLimit.ts`、Redis固定ウィンドウ方式）。あわせて`sync.ts`の`lastPracticedDateKey`に日付形式バリデーションを追加

### Added

- Nバックモードにアダプティブ難易度モードを追加。直近3試行の正誤に応じてN値をリアルタイムで自動昇降させる階段法（`src/lib/nback.ts`）
- ランダムモードに「弱点重視」オプションを追加。各ラウンドのレベルをモードごとの弱点レベルへ自動で合わせる（`src/lib/random.ts`）
- 出題重み付け統計を活用した「誤答パターンの質的フィードバック」を統計画面のモード別正答率に追加（`src/lib/questionWeighting.ts`の`getWeakestBucket`）
- 複数日にまたがる「7日間チャレンジ」進捗カードをホーム画面に追加（`src/lib/program.ts`、ローリングウィンドウ方式）
- PWAインストール促進バナーを結果画面に追加（`src/lib/installPrompt.ts`、`beforeinstallprompt`のシングルトン購読）
- 統計画面に「モード別正答率の時系列グラフ」を追加（`StatsModeTrendSection`）
- 結果画面のシェア文言で自己ベスト更新を強調表示するようにした
- デイリーチャレンジ（日付シードの共通お題、`src/lib/dailyChallenge.ts`）をホーム画面に追加
- 初回起動時のオンボーディングガイド（3ステップの軽量モーダル）を追加（`src/lib/onboarding.ts`）
- 回答フェーズ限定のセッション一時停止機能を、すうじ・空間・変化検出・音/色・ランダムの5モードに追加（`usePauseState`/`PauseOverlay`、`useCountdown`の`paused`引数）

### Fixed

- localStorage読み込み時のスキーマ検証を追加し、不正な形のデータが混入しても統計・XP計算が壊れないようにした（`src/lib/history.ts`の`isValidHistoryEntry`、`questionWeighting.ts`・`missions.ts`にも展開）
- Cronリマインダーの購読者処理を`KEYS`全件スキャン+逐次awaitから`SCAN`カーソル走査+並列処理に変更
- PWAマニフェストのホーム画面ショートカットにデュアルNバック・変化検出・音/色の3モードを追加
- 全問不正解セットでも「今回の獲得XPはなし」を明示するフィードバックを結果画面に追加
- ヘッダーのタップ領域を44px→48pxに拡大（WCAG推奨値に合わせる）
- ホーム画面のモード選択グリッドをゲーミフィケーション要素より上に配置し、初回ユーザーがファーストビューでモードを選べるようレイアウトを変更
- `src/lib/reminder.ts`と`api/_lib/reminder.ts`（意図的な複製ファイル）の実行ロジック差分をCIで検知する仕組みを追加（`scripts/check-reminder-sync.mjs`）

### Changed

- 611行に肥大化していたStatsScreen.tsxを、SettingsScreenと同様のSection分割パターンで7ファイルに分割
- リリース時のバージョン同期手順を`npm version`コマンド運用に変更（手動編集によるズレを防止）
- 「Dual N-Back」モードの表記を日本語UIで「デュアルNバック」に統一（他モードが全て日本語表記である一方、このモードのみ英語表記が残っていたため。英語UIは"Dual N-Back"のまま、内部の`Mode`値`'dual-nback'`は変更なし）
- デュアルNバックモードにも、Nバックモードと同様レベル選択画面で出題数を10/20/30問から選べるようにした（`src/lib/dualNback.ts`の固定値`DUAL_NBACK_SEQUENCE_LENGTH`を廃止）

## [0.7.0] - 2026-08-08

### Changed

- ホーム画面のサブタイトルと各モードカードの説明文を、全モードに即した簡潔な文言に書き直した（元の「逆から答えて」という文言はNバック等、逆から答えない多くのモードに当てはまらなくなっていたため。カード説明文も長すぎて2行に収まらないケースがあったため大幅に短縮）
- Nバックモードを、数字ベースの判定から3×3グリッドのマスが光る位置がN個前と同じかを判定する空間版Nバック課題（Kirchner 1958のspatial n-back課題を参考）に変更。あわせてレベル選択画面で出題数を10/20/30問から選べるようにした（既定20問）
- 学習カレンダーの視認性を改善。色の濃淡の意味が伝わるようキャプション文と回数付きの凡例（0/1/2/3+）を追加し、曜日ラベル（月/水/金）・月ラベルをグリッドに沿って表示して日付との対応を分かりやすくした。今日のマスも枠線で強調
- 統計画面の実績セクションに「n / 全件数 解除」の解除数表示を追加し、グリッドをよりコンパクトなレイアウトに変更。各実績カードをタップ（クリック）すると詳細（ラベル・解除状況・説明文）がインライン表示されるようにし、スマホでもtitle属性のホバーに頼らず詳細を確認できるようにした

### Added

- 実績にプレイヤーLv（XPシステム）関連の3件を追加（🥉駆け出しトレーナー: Lv5到達・🥈熟練トレーナー: Lv10到達・🥇マスタートレーナー: Lv20到達、計21種類に）

## [0.6.0] - 2026-08-08

### Added

- 統計画面の「ワーキングメモリの伸び」（自己比較ベンチマーク）を、Dual N-Back・ランダム・ことば・音/色の4モードにも拡張し、全8モードで表示できるようにした（`src/lib/benchmarks.ts`）。自己比較方式（外部の目安レンジ不要）への移行により、標準化された心理学課題を持たないモードでも設計可能になったための対応
- 実績「🌱 成長中」を追加。「ワーキングメモリの伸び」で正答率が向上中（band: 'above'）のモードが2つ以上あると解除される（`src/lib/achievements.ts`、計17種類に）
- 統計画面の「ワーキングメモリの伸び」に、すうじモード（合計を入力）も追加し、全9エリアで自己比較できるようにした（`src/lib/benchmarks.ts`の`getDigitSumBenchmark`）
- 実績「👑 全モードマスター」を追加。個々の`level-3-*`実績を横断し、全8モードでレベル3に挑戦履歴があると解除される（`src/lib/achievements.ts`、計18種類に）
- 設定画面の効果音セクションに「🔊 テスト再生」ボタンを追加。音声合成セクションには元々あったが効果音側には無く、音量を変更してもゲーム画面へ移動しないと確認できなかったため（`SettingsSoundSection.tsx`）
- ホーム画面のモードカードに、「ワーキングメモリの伸び」で正答率が向上中（band: 'above'）のモードには🌱バッジを表示するようにした。統計画面を開かなくても伸びに気づけるようにするため（`TopScreen.tsx`）

### Changed

- 「ワーキングメモリの伸び」セクションを、対象モードが4→8に倍増し縦長化したため、モード別正答率と同様の2列グリッド表示にコンパクト化（詳細な正答率はtitle属性のツールチップへ移動）

### Fixed

- `digits.test.ts`・`pattern.test.ts`・`spatial.test.ts`・`tone.test.ts`の出題重み付け統計テストが、閾値が実際の期待値に近すぎたため境界値付近で稀に失敗していた問題を修正。5000試行の実測に基づき閾値を標準偏差5倍以上の余裕がある値へ調整し、試行回数も100→500に増やして分散を抑えた（20回連続実行で安定を確認）

## [0.5.0] - 2026-08-07

### Changed

- 順唱モードを廃止し、すうじモードの「逆から入力」「合計を入力」をホーム画面上で独立した2つのモードカードに分割（すうじタイプ選択画面`DigitTypeSelect`は削除し、カードから直接レベル選択へ遷移するように変更）。モード数は9のまま維持（順唱削除+すうじ分割で相殺）。ランダムモードの5ラウンドは「すうじ（逆から/合計）・空間・変化検出・音/色」に変更。関連する`src/lib/sequence.ts`・`SequenceLevelSelect.tsx`・`SequenceGameScreen.tsx`、実績「順唱上級者」、ミッション「順唱を2回プレイ」、ベンチマーク「順唱スパン」を削除し、`Mode`型・`history.ts`のALL_AREAS・`backup.ts`のVALID_MODES・i18n辞書・PWAショートカット(`?shortcut=digit-reverse`)を整合させた
- 統計画面の「ワーキングメモリの目安」を、一般的な心理学的基準との比較から、ユーザー自身の挑戦履歴を前半/後半に分けて正答率を比較する自己比較方式に変更（`src/lib/benchmarks.ts`、見出しも「ワーキングメモリの伸び」に変更）。前半・後半それぞれ最低2回以上の挑戦が無い場合は非表示
- 統計画面の「モード別の正答率」を、モード×レベルごとの縦積みリスト（24行）から、モードごとに1行へまとめ3レベル分をミニバッジで横並び表示するコンパクトなレイアウトに変更し、画面の縦幅を大幅に圧縮した
- BGMのコード進行をC3/A2/F2/G2の低めのマイナー寄り進行から、C4-G3-A3-F3のI-V-vi-IV進行（明るいポップ進行）に変更し、コード長も8秒から4秒に短縮、各コードの頭に短いプラック音を追加して軽快な印象にした。加えて、問題を解いている間（ゲーム画面表示中）はBGMを自動的にダッキング（一時的に無音化）し、レベル選択・結果画面・トップ画面に戻ると再開するようにした（`src/lib/bgm.ts`の`setBgmDucked`、`useBackgroundMusic.ts`の`setGameplayActive`）
- 効果音・BGMの出力を`DynamicsCompressorNode`を介した共有マスターバス（`src/lib/audioContext.ts`の`getMasterBus`）経由に変更し、スマートフォン内蔵スピーカーでも聞き取りやすいよう体感音量を底上げ。タップ音（`playButtonTap`）は高めのクリック音を重ねてゲインも引き上げた
- ホーム画面の見出し・XPバー・今日の目標をまとめたヒーローカードのデザインを刷新し、モバイルでのフォントサイズ・パディングをレスポンシブに調整。モードカードも正方形比率・ホバー/タップ時の視覚効果を強化した

### Added

- ホーム画面の「今日のミッション」カードをクリック可能にし、該当モードの選択画面へ直接遷移できるようにした（プレイ回数系ミッションは対象モードへ、正答率系ミッションは「今日のおすすめ」があればそちらへ）

## [0.4.0] - 2026-08-07

### Added

- `public/privacy.html`（静的なプライバシーポリシーページ、ストア審査等でJS起動なしに直接開ける用）の英語版`public/privacy-en.html`を追加。アプリ内`PrivacyScreen.tsx`の「プライバシーポリシー全文」リンクは、現在の言語設定に応じて`/privacy.html`または`/privacy-en.html`を出し分ける
- プッシュ通知のリマインドメッセージ（`buildReminderMessage`）を購読者のUI言語設定（日本語/英語）に応じて出し分けるように変更。購読時・セット完了ごとの同期時の両方でクライアントから言語を送信し`StoredSubscription.language`として保存する（`src/lib/reminder.ts`/`api/_lib/reminder.ts`、`api/_lib/subscription.ts`、`api/push/subscribe.ts`/`sync.ts`、`api/cron/reminder.ts`）
- BGMを追加。効果音と同じくWeb Audio APIによる完全プログラム生成のアンビエントパッド（4コードを8秒ずつクロスフェードしながら巡回、音声ファイル不使用）で、設定画面に効果音とは独立したON/OFFトグル・音量スライダー（既定OFF・50）を追加した（`src/lib/bgm.ts`、`AppSettings.bgmEnabled`/`bgmVolume`）。効果音とBGMで共有するAudioContextを`src/lib/audioContext.ts`に集約し、自動再生ポリシー対策（最初のユーザー操作での`resume()`）もここに実装。`themeMode`と同じread-modify-writeパターンでApp.tsxがBGM設定を保持し画面遷移をまたいで再生を継続する（`src/hooks/useBackgroundMusic.ts`）
- すうじ・順唱・空間・変化検出・音・色の5モードに出題重み付けを追加。ことばモードのフレーズ単位重み付け（`phraseStats.ts`）と同じ「誤答が多いものほど選ばれやすくなる」考え方を、固定候補プールを持たないこれら5モードにも適用した。生成した系列パターンを粗い特徴（例: 数字の重複有無、隣接マス移動の有無、マスのかたまり具合）へ分類してバケット単位の正誤統計を蓄積し（`src/lib/questionWeighting.ts`、`gyaku-fukushou:questionStats:<mode>`）、出題時は複数候補を生成して苦手なバケットの候補ほど選ばれやすい重み付き抽選を行う

### Fixed

- 「通知希望時刻」という、ユーザーごとの送信時刻選択機能を撤回済み（全ユーザー共通の固定時刻方式へ変更済み、v0.2.0参照）にもかかわらずPRIVACY.md・`public/privacy.html`・`public/privacy-en.html`・i18n辞書（`privacy.notificationsBody`）に残っていた記載漏れを修正

## [0.3.0] - 2026-08-06

### Added

- 統計画面に「ワーキングメモリの目安」セクションを追加（`src/lib/benchmarks.ts`）。すうじ（逆から入力）・順唱・空間・Nバック・変化検出の5モードについて、各モードが対応する心理学の課題（逆唱スパン・順唱スパン・視空間スパン・N-back・視覚ワーキングメモリ容量）で一般的に知られている大まかな目安レンジと比較し、「目安より低め／範囲内／高め」の3段階で表示する。データ不十分なモードは表示せず、常に「医学的な診断ではない」旨の免責文言を併記する
- **大規模機能追加**: 変化検出モードの仕様を「変化あり/なしの2択判定」から「白紙に戻った状態から元々塗りつぶされていたマスを選び直す再生課題」に変更（`src/lib/pattern.ts`、完全一致のみ正解、ベンチマークもCowanのK公式から「マスタリー済み最高レベル」方式に変更）。新モードとして、数字を見た順そのままに入力する「順唱」（`src/lib/sequence.ts`、Forward Digit Span）、位置(3×3)と音(8種の合成トーン)を同時に覚えそれぞれ独立に判定する「Dual N-Back」（`src/lib/dualNback.ts`、Nバックとスコアリングロジックを共通化）、すうじ・順唱・空間・変化検出・音/色から1問ずつシャッフル出題する「ランダム」（`src/lib/random.ts`）を追加し、全9モード構成になった。全モード共通の経験値・プレイヤーレベルシステム（`src/lib/xp.ts`、正解+10XP・全問正解セット+50XP・レベルごとに必要XPが増加）と、日替わりで1件選ばれる「今日のミッション」（`src/lib/missions.ts`、達成で+100XP）を追加。設定画面に効果音の音量スライダー（0〜100、既定80）を追加。ホーム画面は縦積みボタンからモードごとのメタデータを配列化した3×3グリッドのカードUIにリファクタし、プレイヤーLv・XPバー・今日のミッションカードを表示するようにした。あわせて実績を3件（📝 順唱上級者・🧠🧠 Dual N-Back上級者・🌠 コンプリート）追加（計17種類）。バックアップ（`src/lib/backup.ts`）は`missionCompletions`を含む形式（`BACKUP_VERSION: 2`）に対応し、v1形式との後方互換も維持
- アプリ全体のUIを多言語化（日本語/英語）。設定画面の「言語」セクションでいつでも切り替え可能。外部i18nライブラリは使わず、TypeScriptの型チェックでキー網羅性を保証する軽量な自前実装（`src/lib/i18n/`、`src/contexts/LanguageContext.tsx`）。ことばモード（かな文字列の逆復唱）は日本語の音韻に強く依存するため英語版では非表示にし、`TopScreen`・`App.tsx`のルーティング・PWAショートカット解決の各所でガードした。実績のうちことばモード関連3件（🗣️ ことば上級者・🌟 オールラウンダー・🌈 全モード制覇）も英語版の実績グリッドから除外。統計画面の「苦手なフレーズ」表示もことばモード限定のため英語版では非表示。あわせて`achievements.ts`のラベル/説明文をi18n辞書へ分離し、`backup.ts`のインポートエラーメッセージをエラーコード化してUI側で翻訳するように変更した。PWAマニフェスト・`index.html`のmeta情報・`public/privacy.html`は静的アセットのため対象外（既知の制約、ROADMAP.md参照）
- `src/lib/settings.ts`（`loadSettings`/`saveSettings`）にユニットテストを追加。JSON破損時のフォールバック、保存値が非オブジェクトの場合のフォールバック、欠けたフィールドのデフォルト値補完、localStorage利用不可時の耐障害動作をカバー（これまでテストが1件も無かった）

### Fixed

- `src/lib/backup.ts`の`VALID_MODES`に順唱・Dual N-Back・ランダムの3モードが未登録で、これらの履歴を含むバックアップファイルのインポートが一律拒否される不具合を修正（新3モード追加時に更新し忘れていた）
- `e2e/language.spec.ts`が`/N-Back Mode/`という緩い正規表現を使っており、Dual N-Backモード追加後にNバックモードのボタンと2件マッチしてstrict mode違反になっていたため`/^N-Back Mode/`に厳密化
- `e2e/top.spec.ts`が新3モード（空間・変化検出・音/色）追加前のまま「3つのモードボタンが見える」というテスト名・内容で放置されていたため、6モード全てのボタン表示を検証するように更新
- プライバシーポリシーのバックアップ機能に関する記載漏れを修正。`PRIVACY.md`には「バックアップの書き出し/復元」の説明があったが、実際にユーザーへ表示される`public/privacy.html`（静的ページ）と`src/components/PrivacyScreen.tsx`（アプリ内要約画面）の「データの削除方法」節には反映されておらず、3箇所の内容が食い違っていた。両ファイルに追記し、最終更新日を2026-08-02に更新

## [0.2.0] - 2026-08-02

### Added

- 統計画面に「ことばモード: 苦手なフレーズ」セクションを追加。フレーズ単位の正誤履歴（`gyaku-fukushou:phraseStats`）から、最低2回以上挑戦しかつ1回以上誤答したフレーズを正答率の低い順に最大5件表示する（`getWeakestPhrases`）
- ことばモードの出題プールに、フレーズ単位の苦手判定を反映。正誤履歴をフレーズごとに記録し（`src/lib/phraseStats.ts`、`localStorage`キー`gyaku-fukushou:phraseStats`）、誤答が多いフレーズほど次回以降の出題で選ばれやすくなる重み付き抽選に変更した（`pickQuestionSet`）。未挑戦のフレーズは標準ウェイトのまま
- サプライズ演出「🍀 ラッキーデー！」を追加。結果画面表示のたびに12%の確率で表示される完全ランダムな演出で、実績・統計・レベル判定には一切影響しない（`src/lib/luckyBonus.ts`）
- E2Eテストに`@axe-core/playwright`を導入し、主要な静的画面へのWCAG AA自動アクセシビリティ検証（カラーコントラスト含む）を追加（`e2e/accessibility.spec.ts`）
- SetSummaryの結果画面完了までのEnterキー操作をE2Eでカバー（すうじモード）
- トップ画面に「先週の振り返り」カードを追加。週が変わるたびに、直近に完了した週のセット数・正答率・前々週との比較を1回だけ表示する（`src/lib/recap.ts`）
- PWAマニフェストにshortcutsを追加。ホーム画面アイコンの長押し（Android等）から、ことば・すうじ・Nバック・空間の各モードのレベル選択画面へ直接ジャンプできるようにした（`?shortcut=<mode>`クエリをApp.tsxで解釈し、遷移後はクリーンなURLに置き換える）
- 「今日のおすすめ」の判定ロジックを間隔反復（Spaced Repetition）の考え方で強化。正答率だけでなく最終挑戦からの経過日数もスコアに加味し、正答率は高くても長期間触れていない分野を再浮上させるようにした（`getWeakestAreas`）
- ストリークフリーズを追加。1か月に最大2回まで、1日だけの欠落（前後は挑戦済み）を自動的に穴埋めし連続記録を途切れさせないようにした（`getStreakDays`）。2日以上連続の欠落は救済されない
- 結果画面(SetSummary、全モード共通)に「今日の目標: X / Y セット」の進捗表示を追加。目標達成時は達成メッセージを表示し、"もう1セット"への後押しとする
- 通知購読失敗時のエラーメッセージに、OS側の通知設定（Windows/macOS/Androidの設定アプリ）を確認するよう促す文言を追加。ブラウザ側で許可していてもOS側でブロックされていると`pushManager.subscribe()`が失敗することが実機検証で判明したため（[DEPLOYMENT.md](DEPLOYMENT.md)にトラブルシューティング手順を追記）
- プッシュ通知リマインダー機能を追加（オプトイン、既定オフ）。その日1回もプレイしていない場合、毎日21時ごろ（JST、Vercel Cronの実行タイミングにより前後あり）に通知でお知らせする。継続利用率の向上を狙った施策。Vercel Serverless Functions + Redisストレージ（`@upstash/redis`）+ Vercel Cron（1日1回実行）を用いた最小限のバックエンドを追加し、アプリ全体の「バックエンドを持たないSPA」という方針の例外として位置づける（`src/lib/push.ts`、`src/lib/reminder.ts`、`src/sw.ts`（`injectManifest`戦略へ移行）、`api/`配下のServerless Functions、`vercel.json`）。PRIVACY.md/privacy.html/PrivacyScreen.tsx/CLAUDE.md/DEPLOYMENT.mdを本機能に合わせて更新
- （上記の追加実装）Vercel Hobbyプランの「Cronは1日1回まで」という制約が判明したため、当初予定していた「ユーザーごとに送信時刻を選べる」設計を撤回し、全ユーザー共通の固定時刻方式に変更。設定画面の時刻選択UI・`api/push/settings.ts`エンドポイント・`notifyHourJst`設定項目を削除
- Vercel CLIを用いてUpstash for Redis連携・VAPID鍵生成・環境変数（`VITE_VAPID_PUBLIC_KEY`/`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`/`CRON_SECRET`）設定を実施し、本番環境でのプッシュ通知配信基盤を構築
- 空間・変化検出・音/色モードのE2Eスモークテストを追加し、CLAUDE.md（画面遷移図・Feature requirements・実績一覧・データモデル）とREADME.mdを新3モードの内容で更新
- 音・色モードを追加。4色のパッドが音とともに光る順番を覚え、同じ順にタップして再現する非言語性の聴覚ワーキングメモリトレーニング（ピッチ記憶が言語・数字の記憶と独立した貯蔵系であることを示すDeutsch 1970などの知見を参考）。レベル1（3音）／レベル2（4音）／レベル3（5音）の3段階（`src/lib/tone.ts`、`ToneLevelSelect`、`ToneGameScreen`、`playPadTone`）
- 変化検出モードを追加。一瞬表示される模様を覚え、もう一度見せたときに変化しているかどうかを判定する視覚パターン記憶トレーニング（Luck & Vogel 1997の変化検出課題を参考）。レベル1（4×4・4マス）／レベル2（4×4・6マス）／レベル3（5×5・8マス）の3段階（`src/lib/pattern.ts`、`PatternLevelSelect`、`PatternGameScreen`）
- 空間モードを追加。マスが一定順序で光る様子を覚え、逆の順番でタップして答える視空間ワーキングメモリトレーニング（Corsi Block-Tapping Taskを参考）。レベル1（3×3・3マス）／レベル2（3×3・4マス）／レベル3（4×4・5マス）の3段階（`src/lib/spatial.ts`、`SpatialLevelSelect`、`SpatialGameScreen`）
- 結果画面（SetSummary、全モード共通）に「結果をシェア」機能を追加。正答数・連続挑戦日数・新規実績をまとめたテキストを`navigator.share`で共有し、非対応環境ではクリップボードコピーにフォールバックする（`src/lib/share.ts`）
- 学習データのバックアップ（エクスポート/インポート）機能を追加。設定画面からトレーニング履歴・アプリ設定をJSONファイルとして書き出し・復元できる。localStorageのみに依存する構成でのデータ消失リスクに対応（`src/lib/backup.ts`、不正なデータ形式は検証して拒否）
- 統計画面に学習カレンダー（GitHub風ヒートマップ）を追加。日曜始まりの週単位グリッドで直近18週間の日別セット数を可視化し、継続の実感を後押しする（`getActivityCalendar`）
- CI（GitHub Actions）を導入し、push/PR時にlint・test・buildを自動実行
- ROADMAP.md、CHANGELOG.mdを追加
- E2Eテスト（Playwright）を導入し、主要画面遷移・すうじ/Nバックモードのプレイ導線をカバー。CIにも統合
- エラー監視・ロギング方針を実装（`ErrorBoundary`、グローバルエラーハンドラ、[ERROR_HANDLING.md](ERROR_HANDLING.md)）
- アクセシビリティ方針を明文化し、aria-label・aria-live・フォーカス管理を見直し（[ACCESSIBILITY.md](ACCESSIBILITY.md)）
- プライバシーポリシーを作成（[PRIVACY.md](PRIVACY.md)＋設定画面から遷移できるアプリ内画面＋JS起動不要な静的ページ`public/privacy.html`）
- デプロイ手順書を作成（[DEPLOYMENT.md](DEPLOYMENT.md)）
- VercelとGitHubリポジトリのGit連携を設定し、masterへのpushで自動デプロイされるように変更
- トップ画面に「🎯 今日のおすすめ」カードを追加。苦手分野（`getWeakestAreas`）をワンタップで直接プレイ開始できるように
- 結果画面に自己ベスト更新バッジ（🏅）を追加。モード・レベルごとの過去最高正答率を`getBestSetAccuracy`で判定
- トップ画面にストリーク危機感バナーを追加（連続日数があるのに当日未挑戦の場合に表示）
- ことばモードに`SpeechRecognition`非対応ブラウザ向けのテキスト入力フォールバックを追加。従来はレベル選択自体をブロックしていたが、テキスト入力で全レベルに挑戦できるように変更
- ことば/すうじモードの結果表示中、Enterキーで次の問題へ進めるように対応（すうじモードの回答入力は既に対応済み）
- Nバックモードの「一致」操作にEnterキーも追加（スペースキーと併用可）
- 3問セット完了後の結果まとめ画面（SetSummary、全モード共通）で、Enterキーによる主要アクション（提案があればそれ、なければ「同じレベルでもう一度」）の実行に対応
- 設定画面に「学習履歴をすべて削除」ボタンを追加（確認ダイアログ付き）。これまでPRIVACY.mdで「専用機能は未提供」としていたギャップを解消
- 苦手分野の判定（`getWeakestAreas`）を改善。1回のたまたまの失敗で「今日のおすすめ」に出てしまわないよう、挑戦回数が十分な項目を優先するようにした
- E2Eテストを追加（結果表示中のEnterキー操作、ことばモードのテキスト入力フォールバック）
- SEO/SNSシェア対応として`index.html`にmeta description・OGP・Twitter Cardタグを追加

### Fixed

- 音声合成（Web Speech API）が一部ブラウザで`onend`/`onerror`を発火せず、ことばモードの読み上げ（`reading`フェーズ）がまれに進行不能になりうる問題への対策として、文字数に応じたタイムアウトフォールバックを追加（`src/hooks/useSpeechSynthesis.ts`）
- axe-coreの自動検証で判明したWCAG AA未達のコントラスト比を修正。レベル選択ボタンの配色（`LEVEL_STYLES`）、設定画面のトグルボタン、レベル選択ボタン内の半透明テキスト（説明文・正答率表示）を不透明かつ十分に濃い配色に変更。あわせて音声選択の`<select>`にアクセシブルな名前（`aria-label`）を追加
- **[重要]** 結果まとめ画面（SetSummary）表示中にEnterキーを押すと、直前の問題用の「結果表示中はEnterで次へ」ハンドラが解除されずSetSummary自身のEnterハンドラと二重に発火し、学習履歴が二重記録されてしまうバグを修正（全モード共通、`finished`状態をハンドラの有効条件に追加）
- E2Eテスト「設定画面: リマインド通知セクションが表示される」が、`.env.local`にVAPID公開鍵が設定されたことで前提が崩れ失敗していたため、対応環境向けの表示を検証する内容に更新
- `src/lib/push.ts`の`subscribeToPush()`が失敗理由を握りつぶしていたため、実機で購読に失敗しても原因を特定できなかった問題を修正。`console.error`で実際のエラー内容を出力するようにした
- `api/cron/reminder.ts`で`web-push`（CommonJSパッケージ）から名前付きimportしていたため、Vercel Functions（ESM）環境で`SyntaxError`が発生し関数が起動しなかった問題を修正。default importしてから分割する形に変更
- `api/`配下の全ハンドラがWeb標準の`Request`/`Response`を前提にしていたため、実際のVercel Node Functionsのランタイム（Node.js標準の`(req, res)`形式、`req.headers`はプレーンオブジェクトで`.get()`を持たない）と不一致を起こしTypeErrorで落ちていた問題を修正。`api/_lib/http.ts`にNode.js形式向けのJSON送受信ヘルパーを追加し、全ハンドラをNode.js形式に書き直した
- 学習データのバックアップ（エクスポート/インポート）機能で、空間・変化検出・音/色モード（新3モード）の履歴を含むバックアップファイルがインポート時に「学習履歴のデータ形式が正しくありません」として一律拒否される不具合を修正。`src/lib/backup.ts`の`VALID_MODES`が新3モード追加時に更新されておらず、`word`/`digit`/`nback`のみを許可していたのが原因（`spatial`/`pattern`/`tone`を追加）
- `index.html`のviewport metaに`viewport-fit=cover`を追加。これが無いとiOS Safariで`env(safe-area-inset-*)`が常に0として扱われ、App.tsxで指定していたノッチ・ホームインジケーター避けのpaddingが実質的に無効化されていた

### Changed

- 品質・保守性向上のためのリファクタリング3周目を実施（機能仕様・UIの変更なし）
  - `SettingsScreen.tsx`（419行、テーマ/音声/効果音/日次目標/通知/バックアップが1コンポーネントに同居）を6つのセクションコンポーネント（`SettingsThemeSection`/`SettingsVoiceSection`/`SettingsDailyGoalSection`/`SettingsSoundSection`/`SettingsNotificationSection`/`SettingsDataSection`）に分割。`SettingsScreen.tsx`は`AppSettings`の保持とprops受け渡しのみを担うシェルに縮小（419行→99行）
- 品質・保守性向上のためのリファクタリング2周目を実施（機能仕様・UIの変更なし）
  - Digit/Spatial/Tone/NBackの4画面で重複していた「ready→showing」ステップ式の出題演出（数字・マス・パッドを1つずつ表示）を`src/hooks/useStepReveal.ts`へ共通化
  - 6つのゲーム画面で約150行ほぼ同一のまま重複していた「セット完了時の履歴記録・自己ベスト判定・新規実績判定・レベルアップ/実績解除の効果音再生」処理を`src/hooks/useSetCompletionRecorder.ts`へ共通化(最大のDRY違反だった箇所）
  - 6つのゲーム画面で再定義されていた同一形状のprops型（`level`/`onExit`/`onSelectLevel`）を`types.ts`の`BaseGameScreenProps`に共通化
  - `src/lib/push.ts`の`urlBase64ToUint8Array`をexportしユニットテストを追加（push.ts自体はこれまでテストが無かった）
  - `getActivityCalendar`にテスト用の`now`引数（デフォルト値付き、既存呼び出しへの影響なし）を追加。あわせて、実時刻（daysAgo）依存で実行タイミング（日曜日・月境界）によりまれに失敗していた`history.test.ts`の2テストを固定日付での検証に修正
  - コードコメントの表記統一（既存の英語コメント数箇所を日本語に修正）
- 品質・保守性向上のためのリファクタリング1周目を実施（機能仕様・UIの変更なし）
  - 結果表示中にEnterキーで次の問題へ進める処理が5つのゲーム画面コンポーネントで重複していたため、`src/hooks/useEnterKey.ts`へ共通化
  - 回答フェーズの残り時間カウントダウン＋タイムアウト自動採点が4つのゲーム画面コンポーネントで重複していたため、`src/hooks/useCountdown.ts`へ共通化。あわせて、タイムアウト時に最新の入力値を読むために`setState`のアップデータ関数内で採点処理（副作用）を呼んでいた実装をrefベースの読み取りに修正
  - `StatsScreen`の統計計算（`getAllAreaStats`等）を`useMemo`化し、不要な再計算を回避
  - `SettingsScreen`の`React.ChangeEvent`参照を他ファイルと同様に明示importする形式に統一
  - `getStreakDays`にテスト用の`now`引数（デフォルト値付き、既存呼び出しへの影響なし）を追加し、ストリークフリーズの月またぎ挙動を決定的にテストできるようにした
  - `history.test.ts`に、ストリークフリーズの猶予が暦月ごとに独立してリセットされるケースと、`getWeakestAreas`でスコアが同点の場合に挑戦回数の多い方を優先するタイブレークのテストケースを追加
- 要件定義書.mdの内容をCLAUDE.mdに統合（画面遷移図はMermaid形式に変換）
- GitHubリポジトリをPublicに変更後、連絡先メールアドレスを記載する都合上Privateに戻した
- プライバシーポリシーの連絡先をGitHub Issueからメールアドレスに変更
- GitHubリポジトリをPublicに変更（連絡先メールアドレスは公開前に別途記載予定のため、プライバシーポリシー本文からは一時的に削除）
- GitHub ActionsのNode.js 20非推奨警告を解消（`actions/checkout`・`actions/setup-node`をv5系へ更新）

### Performance

- `GameScreen`/`DigitGameScreen`/`NBackGameScreen`を`React.lazy`による遅延読み込みに変更。初期表示に必要なJSバンドルを約253KB→約234KB（gzip: 約76.7KB→約72.9KB）に削減し、モバイル回線での初回表示を高速化

## [0.1.0] - 2026-08-01

### Added

- 初回コミット。ことば／すうじ／Nバックの3モードを実装
- 実績（アチーブメント）システム（11種類、動的判定）
- Web Audio APIによるプログラム生成の効果音システム
- 統計・履歴画面、設定画面（テーマ／音声／効果音／目標セット数）
- PWA対応（`vite-plugin-pwa`）
- GitHubリポジトリ連携（[Compass-1024/gyaku-fukushou-app](https://github.com/Compass-1024/gyaku-fukushou-app)）
