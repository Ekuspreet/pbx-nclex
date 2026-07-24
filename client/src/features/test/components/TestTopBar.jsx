import { formatTestTime } from '../testUtils.js'

function TestTopBar({ current, question, questionCount, test, timeMs, userName }) {
  const mode = `${test?.tutorMode ? 'Tutored' : 'Untutored'}, ${test?.timed ? 'Timed' : 'Untimed'}`

  return (
    <header className="grid min-h-[68px] shrink-0 grid-cols-2 items-center gap-x-3 gap-y-1 border-b-2 border-test-bar-content bg-test-bar px-3.5 py-2 text-xs font-bold leading-tight text-test-bar-content sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:text-sm">
      <div className="flex flex-col gap-1">
        <p>NCLEX-RN</p>
        <p>{userName || 'PBX learner'}</p>
      </div>
      <div className="order-3 col-span-2 flex min-w-0 flex-col justify-self-center text-center sm:order-none sm:col-span-1">
        <p>Test ID: {test?.id || 'N/A'} <span>({mode})</span></p>
        <p className="mt-1">QID: {question?.question?.questionId || 'N/A'}</p>
      </div>
      <div className="flex flex-col items-end justify-self-end gap-1 text-right">
        <p className="flex items-center gap-1">Time <span className="material-symbols-outlined !text-[18px]">timer</span> {formatTestTime(timeMs)}</p>
        <p className="flex items-center gap-1">Question <span className="material-symbols-outlined !text-[18px]">quiz</span> {questionCount ? current + 1 : 0} of {questionCount}</p>
      </div>
    </header>
  )
}

export default TestTopBar
