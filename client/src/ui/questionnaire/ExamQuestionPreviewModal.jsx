import { useEffect, useState } from 'react'
import ExplanationPanel from './ExplanationPanel.jsx'
import QuestionRenderer from './QuestionRenderer.jsx'

function ExamPreviewTopBar({ onClose, question }) {
  return (
    <div className="grid grid-cols-3 items-center bg-base-300 px-2 py-1 shadow-sm">
      <div className="flex flex-col font-bold">
        <p>NCLEX-RN</p>
        <p>READINESS ASSESSMENT</p>
      </div>
      <div className="flex flex-col justify-self-center">
        <p className="cursor-pointer text-sm font-bold">QID : {question?.questionId || 'N/A'}</p>
      </div>
      <div className="justify-self-end">
        <button className="btn btn-ghost btn-square btn-sm" type="button" onClick={onClose} aria-label="Close exam preview">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  )
}

function ExamQuestionPreviewModal({ onClose, question }) {
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    setAnswer('')
  }, [question?.id])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="exam-preview-overlay fixed inset-0 z-[9999] grid place-items-center bg-neutral/60 p-3 text-base-content" data-theme="nord" role="dialog" aria-modal="true">
      <div className="exam-preview-window relative flex h-[88vh] w-[96vw] max-w-7xl overflow-hidden rounded-lg border border-base-300 bg-base-100 text-base-content shadow-xl">
        <main className="flex min-h-0 flex-1 flex-col border-l border-base-content/20">
          <ExamPreviewTopBar question={question} onClose={onClose} />
          <section className="flex min-h-0 flex-1 overflow-hidden p-2">
            <div className="max-w-4/5 min-h-0 flex-1 overflow-y-auto">
              <QuestionRenderer
                answerState={{ value: answer, submitted: true }}
                question={question}
                showSubmit={false}
                onAnswerChange={setAnswer}
                onSubmit={() => {}}
              />
            </div>
            <ExplanationPanel className="ml-3 flex-1 border-l border-base-300 pl-3" html={question?.explanationText || ''} />
          </section>
        </main>
      </div>
    </div>
  )
}

export default ExamQuestionPreviewModal
