// モードを途中でやめて（← レベル選択）再挑戦した際、直前のセットで実際に
// 表示済みだった問題が再び出題されないようにするための一時保存。
// sessionStorage（タブが生きている間のみ有効）を使い、次の出題生成時に
// 一度だけ読み取って消費する（読んだら削除する。次々回以降には影響しない）。
// すうじ（逆から入力/合計を入力）は出題内容自体（数字列）を共有するため、
// キーは`digit:<level>`のようにgameTypeを含めず、単体モード・ランダムモード
// 双方の出題生成で共通に参照・更新する
const PREFIX = 'gyaku-fukushou:recentQuestions:'

export function saveRecentQuestions(key: string, items: readonly unknown[]): void {
  if (items.length === 0) return
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(items))
  } catch {
    /* sessionStorage利用不可（プライベートモード等）は無視 */
  }
}

export function consumeRecentQuestions<T>(key: string): T[] {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return []
    sessionStorage.removeItem(PREFIX + key)
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}
