import { useState } from 'react'
import { formatTestTime } from '../testUtils.js'

function TestTopBar({ current, question, questionCount, test, timeMs, userName }) {
  const [timeHidden, setTimeHidden] = useState(false)
  const [questionHidden, setQuestionHidden] = useState(false)
  const mode = `${test?.tutorMode ? 'Tutored' : 'Untutored'}, ${test?.timed ? 'Timed' : 'Untimed'}`

  return (
    <header className="grid min-h-[68px] shrink-0 grid-cols-2 items-center gap-x-3 gap-y-1 border-b-2 border-test-bar-content bg-test-bar px-3.5 py-2 text-[15px] font-bold leading-[1.2] text-test-bar-content sm:grid-cols-[minmax(260px,1fr)_auto_minmax(260px,1fr)]">
      <div className="flex flex-col gap-1">
        <p>NCLEX-RN</p>
        <p>{userName || 'PBX learner'}</p>
      </div>
      <div className="order-3 col-span-2 flex min-w-0 flex-col justify-self-center text-center sm:order-none sm:col-span-1">
        <p>Test ID: {test?.id || 'N/A'} <span>({mode})</span></p>
        <p className="mt-1 text-sm">QID: {question?.question?.questionId || 'N/A'}</p>
      </div>
      <div className="flex flex-col items-end justify-self-end gap-[5px] text-right">
        <button className="flex cursor-pointer items-center gap-2 py-px leading-[0.8]" type="button" aria-pressed={timeHidden} onClick={() => setTimeHidden((hidden) => !hidden)}><span className="min-w-[72px] text-right">Time <span className="material-symbols-outlined ml-1 !text-[18px]">timer</span></span><span className="whitespace-nowrap">{timeHidden ? '—' : formatTestTime(timeMs)}</span></button>
        <button className="flex cursor-pointer items-center gap-2 py-px leading-[0.8]" type="button" aria-pressed={questionHidden} onClick={() => setQuestionHidden((hidden) => !hidden)}><span className="min-w-[72px] text-right">Question <span className="material-symbols-outlined ml-1 !text-[18px]">quiz</span></span><span className="whitespace-nowrap">{questionHidden ? '—' : `${questionCount ? current + 1 : 0} of ${questionCount}`}</span></button>
      </div>
    </header>
  )
}

export default TestTopBar
