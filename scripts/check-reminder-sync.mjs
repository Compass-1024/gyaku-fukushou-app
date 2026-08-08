// src/lib/reminder.ts と api/_lib/reminder.ts は意図的な複製ファイル
// （Vercel FunctionsのビルドをVite側のtsconfig/DOM libから独立させるため、
// CLAUDE.mdに明記された既知の技術的負債）。ロジックの二重管理はヒューマン
// エラーのリスクを伴うため、CIで「実行ロジックが実質同一であること」を
// 機械的に検証する。型定義の書き方（`Language`型のimport有無など）だけの
// 差異は許容し、コメント・空行を除いた実行ロジックの一致を見る。
import { readFileSync } from 'node:fs'

const IGNORED_LINES = new Set([
  "import type { Language } from '../types'",
  "export type ReminderLanguage = 'ja' | 'en'",
])

function normalize(source) {
  // 行の折り返し位置（Prettier等の整形差）は意味を持たないため、
  // 空白・改行を完全に除去したトークン列として比較する
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//'))
    .filter((line) => !IGNORED_LINES.has(line))
    .map((line) => line.replaceAll('ReminderLanguage', 'Language'))
    .join(' ')
    .replace(/\s+/g, '')
    // 複数行に折り返された引数リストの末尾カンマ（Prettierが付与）は
    // 1行にまとめると意味を持たないため除去する
    .replace(/,([)}])/g, '$1')
}

const a = normalize(readFileSync('src/lib/reminder.ts', 'utf8'))
const b = normalize(readFileSync('api/_lib/reminder.ts', 'utf8'))

if (a !== b) {
  console.error(
    '[check-reminder-sync] src/lib/reminder.ts と api/_lib/reminder.ts の実行ロジックが乖離しています。' +
      '片方を変更したらもう一方も同期してください（CLAUDE.mdの「プッシュ通知リマインダー」セクション参照）。',
  )
  process.exit(1)
}

console.log('[check-reminder-sync] OK: 2ファイルの実行ロジックは同期しています')
