# 逆復唱トレーニング

ワーキングメモリ改善のための逆復唱アプリ。単語や短い文章を音声で聞き、復唱したのち、今度は逆順で声に出して答える。React 19 + TypeScript + Vite + Tailwind CSS v4 製。

## レベル

1. 単語（3〜5文字）
2. 単語（5〜7文字）
3. 単語もしくは文章（7〜9文字）

各レベル、3問セットで出題する。

## 仕組み

1. Web Speech API の `SpeechSynthesis` で問題文を読み上げる
2. 復唱のための時間を設ける（カウントダウン表示）
3. Web Speech API の `SpeechRecognition` で逆から発話した内容を認識する
4. 正しい逆さ言葉と比較し、正解・不正解を判定する

`SpeechRecognition` は Chrome / Edge など一部のブラウザでのみ対応。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — 型チェック後に本番ビルド
- `npm run lint` — oxlint 実行
- `npm run preview` — 本番ビルドのプレビュー
