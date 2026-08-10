import { useState } from 'react'
import { useTranslation } from '../contexts/LanguageContext'

interface OnboardingGuideProps {
  onDismiss: () => void
}

// ④-10(代替): 初回起動時に表示する簡易オンボーディング。フルスクリーンの
// モーダルではなく、トップ画面の上に重ねるカードとして表示する（実装を
// 軽量に保ちつつ、下のモード一覧が透けて見えることでアプリの雰囲気が
// 伝わるようにする狙い）
export function OnboardingGuide({ onDismiss }: OnboardingGuideProps) {
  const t = useTranslation()
  const [stepIndex, setStepIndex] = useState(0)
  const steps = t.onboarding.steps
  const isLastStep = stepIndex === steps.length - 1
  const step = steps[stepIndex]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center sm:pb-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">
          {t.onboarding.stepProgress(stepIndex + 1, steps.length)}
        </p>
        <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {step.body}
        </p>

        <div className="mt-4 flex justify-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.title}
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                i === stepIndex
                  ? 'bg-indigo-500'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="-m-2 touch-manipulation p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
          >
            {t.onboarding.skip}
          </button>
          <button
            type="button"
            onClick={() => (isLastStep ? onDismiss() : setStepIndex((i) => i + 1))}
            className="touch-manipulation rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            {isLastStep ? t.onboarding.start : t.onboarding.next}
          </button>
        </div>
      </div>
    </div>
  )
}
