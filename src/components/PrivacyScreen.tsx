interface PrivacyScreenProps {
  onBack: () => void
}

export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        ← 戻る
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        プライバシーポリシー
      </h1>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            データの保存先
          </h2>
          <p>
            本アプリはサーバーを持たず、トレーニング履歴やアプリ設定はすべて
            お使いの端末のブラウザ（localStorage）にのみ保存されます。運営者を含む
            第三者にデータが送信されることはありません。
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            マイク（音声）について
          </h2>
          <p>
            「ことばモード」では、ブラウザの音声認識機能（Web Speech API）を
            利用して復唱内容を判定します。本アプリ自体が音声データを収集・保存する
            ことはありませんが、ブラウザによっては音声データがブラウザベンダーの
            サーバーで処理される場合があります（ブラウザの仕様によるものです）。
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Cookie・アクセス解析
          </h2>
          <p>
            Cookieやアクセス解析ツール、広告トラッキングは使用していません。
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            データの削除
          </h2>
          <p>
            ブラウザの設定からサイトデータ（localStorage）を削除することで、
            保存されているすべてのデータを消去できます。
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            お問い合わせ
          </h2>
          <p>お問い合わせ窓口は現在準備中です。</p>
        </section>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          このページは要約です。詳細な内容は
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="underline">
            プライバシーポリシー全文
          </a>
          を参照してください。
        </p>
      </div>
    </div>
  )
}
