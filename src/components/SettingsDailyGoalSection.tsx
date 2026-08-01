const DAILY_GOAL_OPTIONS = [1, 3, 5, 10]

interface SettingsDailyGoalSectionProps {
  dailyGoal: number
  onChangeGoal: (goal: number) => void
}

export function SettingsDailyGoalSection({
  dailyGoal,
  onChangeGoal,
}: SettingsDailyGoalSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        1日の目標セット数
      </h2>
      <div className="flex gap-2">
        {DAILY_GOAL_OPTIONS.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => onChangeGoal(goal)}
            className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
              dailyGoal === goal
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {goal}
          </button>
        ))}
      </div>
    </section>
  )
}
