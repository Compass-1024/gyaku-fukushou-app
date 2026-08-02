import type { Level, Phrase } from '../types'
import { getPhraseWeight, type PhraseStats } from './phraseStats'

// 全てひらがな表記。読み上げ・逆復唱の判定の両方でこの文字列をそのまま使う。
const RAW_PHRASES: Record<Level, string[]> = {
  1: [
    'かさ',
    'くつ',
    'ふえ',
    'にじ',
    'ゆき',
    'あめ',
    'くも',
    'つき',
    'ほし',
    'ばす',
    'ふね',
    'いす',
    'さめ',
    'たこ',
    'いか',
    'かに',
    'えび',
    'はと',
    'わし',
    'たか',
    'かも',
    'こま',
    'りんご',
    'さくら',
    'たまご',
    'みかん',
    'くじら',
    'とけい',
    'さかな',
    'はさみ',
    'かがみ',
    'とんぼ',
    'かえる',
    'すいか',
    'めだか',
    'たぬき',
    'きつね',
    'ぱんだ',
    'こあら',
    'あひる',
    'いちご',
    'ぶどう',
    'めろん',
    'ばなな',
    'うどん',
    'おかし',
    'けーき',
    'ぷりん',
    'すなば',
    'ばけつ',
    'うきわ',
    'えんぴつ',
    'ひこうき',
    'たいよう',
    'くつした',
    'ふうせん',
    'たんぽぽ',
    'しまうま',
    'ぺんぎん',
    'はちみつ',
    'おにぎり',
    'らーめん',
    'てぶくろ',
  ],
  2: [
    'くじゃく',
    'かまきり',
    'ひまわり',
    'あさがお',
    'おりがみ',
    'くれよん',
    'ふうりん',
    'たいふう',
    'かみなり',
    'うちゅう',
    'かぶとむし',
    'かたつむり',
    'すべりだい',
    'さかなつり',
    'たいこばし',
    'ひこうせん',
    'じてんしゃ',
    'おーとばい',
    'こうさてん',
    'きょうしつ',
    'としょかん',
    'ほけんしつ',
    'れいぞうこ',
    'せんぷうき',
    'かぶとがに',
    'かたぐるま',
    'とうもろこし',
    'ねこじゃらし',
    'いぬのさんぽ',
    'うみでおよぐ',
    'やまにのぼる',
    'えほんをよむ',
    'かぜがつよい',
    'はなびをみる',
    'てんとうむし',
    'たいいくかん',
    'ぞうがあるく',
    'ほんをかりる',
    'うたをうたう',
    'そうじをする',
    'てがみをかく',
    'ほんをかえす',
    'かおをあらう',
    'かみをとかす',
    'かわであそぶ',
    'もりをあるく',
    'にわであそぶ',
    'いぬがはしる',
    'ねこがねむる',
    'はなをかざる',
    'あしをあらう',
    'くちをあける',
    'みみをすます',
    'あたまをかく',
    'ゆびをまげる',
    'いえにかえる',
    'まどをあける',
    'でんきをけす',
    'にもつをもつ',
    'ほんをひらく',
    'おいかけっこ',
    'たかいたかい',
    'しゃぼんだま',
    'ゆきがっせん',
    'かみひこうき',
    'いろえんぴつ',
    'ずがこうさく',
    'たいいくしつ',
    'おんがくしつ',
  ],
  3: [
    'ひまわりばたけ',
    'あさがおのはな',
    'がっこうにいく',
    'でんしゃにのる',
    'たこやきをやく',
    'おんがくをきく',
    'おかしをたべる',
    'すいかをたべる',
    'おふろにはいる',
    'しょくいんしつ',
    'にわとりがなく',
    'うさぎがはねる',
    'きりんがたべる',
    'だんすをおどる',
    'しゃしんをとる',
    'かいものにいく',
    'こうえんへいく',
    'ともだちにあう',
    'たこあげをする',
    'あめがふってきた',
    'おにぎりをたべる',
    'じてんしゃにのる',
    'ともだちとあそぶ',
    'こうえんであそぶ',
    'ゆきがふってきた',
    'かたつむりのから',
    'すいえいたいかい',
    'としょかんへいく',
    'おとうさんとつり',
    'らいおんがほえる',
    'りょうりをつくる',
    'べんきょうをする',
    'あさはやくおきる',
    'はなにみずをやる',
    'やさいをそだてる',
    'てつぼうであそぶ',
    'おにごっこをする',
    'かくれんぼをする',
    'さかあがりをする',
    'おはじきであそぶ',
  ],
}

export const LEVEL_LABELS: Record<Level, string> = {
  1: 'レベル1（2〜4文字の単語）',
  2: 'レベル2（4〜6文字の単語）',
  3: 'レベル3（6〜8文字の単語・文章）',
}

export const PHRASES: Record<Level, Phrase[]> = {
  1: RAW_PHRASES[1].map((text, i) => ({ id: `1-${i}`, text })),
  2: RAW_PHRASES[2].map((text, i) => ({ id: `2-${i}`, text })),
  3: RAW_PHRASES[3].map((text, i) => ({ id: `3-${i}`, text })),
}

const PHRASE_BY_ID: Map<string, Phrase> = new Map(
  ([1, 2, 3] as const).flatMap((level) => PHRASES[level].map((p) => [p.id, p])),
)

export function findPhraseById(id: string): Phrase | undefined {
  return PHRASE_BY_ID.get(id)
}

const QUESTIONS_PER_SET = 3

// phraseStatsを渡すと、誤答が多いフレーズほど選ばれやすい重み付き抽選になる
// （省略時は全フレーズ等確率＝従来どおりの挙動）
export function pickQuestionSet(
  level: Level,
  phraseStats: PhraseStats = {},
): Phrase[] {
  const pool = [...PHRASES[level]]
  const picked: Phrase[] = []
  for (let i = 0; i < QUESTIONS_PER_SET && pool.length > 0; i++) {
    const weights = pool.map((p) => getPhraseWeight(phraseStats, p.id))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let r = Math.random() * totalWeight
    let index = pool.length - 1
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j]
      if (r <= 0) {
        index = j
        break
      }
    }
    picked.push(pool[index])
    pool.splice(index, 1)
  }
  return picked
}

// 復唱（覚え直し）にかける時間。レベルが上がるほど長くする。
export const REPEAT_SECONDS: Record<Level, number> = { 1: 4, 2: 5, 3: 6 }

// 音声認識のあいまい一致で許容する編集距離。長い単語ほど聞き間違いの揺れが出やすいため広げる
export const MATCH_TOLERANCE: Record<Level, number> = { 1: 1, 2: 1, 3: 2 }

// 単語が長いほど発話に時間がかかるため、文字数に応じて聞き取り時間を伸ばす
const LISTEN_BASE_MS = 4000
const LISTEN_MS_PER_CHAR = 700

export function getListenTimeoutMs(length: number): number {
  return LISTEN_BASE_MS + length * LISTEN_MS_PER_CHAR
}
