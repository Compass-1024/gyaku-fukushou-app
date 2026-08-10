// Android実装(TWA)を見据えた対応。モバイルOSはメモリ逼迫時にバックグラウンドの
// タブ/TWAのプロセスを再生成する（＝ページの再読み込みと同義）ことがあり、
// 復帰後に回答中のセットが失われうる。sessionStorage（同一タブのセッション中は
// 生き残るが、タブを閉じれば消える）に「これまでの正誤結果・現在の問題位置」
// だけを保存し、再読み込み後に同じ設定（レベル等）で開き直された場合に限り
// 復元する。回答途中の入力やタイマーの残り時間までは対象にしない
// （タイマーは復元後にそのレベルの規定値でやり直しになるが、正誤結果が
// 丸ごと消えるよりはるかに実害が小さいため）

const SESSION_TTL_MS = 30 * 60 * 1000 // 30分以上前の途中経過は復元しない

export interface PersistedGameSession<Q, R> {
  questions: Q[]
  questionLevels?: number[]
  maxLevelReached?: number
  results: R[]
  currentIndex: number
  savedAt: number
}

type StoredSession<Q, R> = Omit<PersistedGameSession<Q, R>, 'savedAt'> & {
  savedAt: number
}

export function saveGameSession<Q, R>(
  key: string,
  data: Omit<PersistedGameSession<Q, R>, 'savedAt'>,
): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }))
  } catch {
    /* sessionStorage利用不可（プライベートモード等）は無視してよい */
  }
}

export function loadGameSession<Q, R>(key: string): PersistedGameSession<Q, R> | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const session = parsed as StoredSession<Q, R>
    if (
      typeof session.savedAt !== 'number' ||
      Date.now() - session.savedAt > SESSION_TTL_MS ||
      !Array.isArray(session.questions) ||
      !Array.isArray(session.results) ||
      typeof session.currentIndex !== 'number'
    ) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearGameSession(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* sessionStorage利用不可（プライベートモード等）は無視してよい */
  }
}
