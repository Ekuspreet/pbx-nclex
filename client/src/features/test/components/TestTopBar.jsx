import { formatTestTime } from '../testUtils.js'

function TestTopBar({ current, question, questionCount, test, timeMs, userName }) {
  const mode = `${test?.tutorMode ? 'Tutored' : 'Untutored'}, ${test?.timed ? 'Timed' : 'Untimed'}`

  return (
    <header className="grid grid-cols-3 items-center bg-test-bar px-2 py-1 text-test-bar-content shadow-sm">
      <div className="flex flex-col">
        <p>NCLEX-RN</p>
        <p>{userName || 'PBX learner'}</p>
      </div>
      <div className="flex flex-col justify-self-center text-center">
        <p>Test Id: {test?.id || 'N/A'} <span>({mode})</span></p>
        <p>QId: {question?.question?.questionId || 'N/A'}</p>
      </div>
      <div className="flex flex-col justify-self-end text-right">
        <p>Time : {formatTestTime(timeMs)}</p>
        <p>Question : {questionCount ? current + 1 : 0} of {questionCount}</p>
      </div>
    </header>
  )
}

export default TestTopBar
