import { useEffect, useState } from 'react'
import AnswerIndicator from '../../../ui/questionnaire/AnswerIndicator.jsx'
import ReferenceHtml from '../../../ui/questionnaire/ReferenceHtml.jsx'
import { getCorrectAnswer, stripExhibitLink } from '../../../ui/questionnaire/questionHelpers.js'

function getApiOrigin() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

  try {
    const url = new URL(apiBase)
    return url.origin
  } catch {
    return apiBase.replace(/\/api\/v\d+$/, '')
  }
}

function getExhibitUrl(exhibit) {
  if (!exhibit?.fileName) return ''
  if (/^https?:\/\//i.test(exhibit.fileName)) return exhibit.fileName
  if (/^https?:\/\//i.test(exhibit.baseUrl || '')) return `${exhibit.baseUrl.replace(/\/$/, '')}/${exhibit.fileName}`

  return `${getApiOrigin()}/public/exhibits/${exhibit.fileName}`
}

function ExhibitModal({ exhibit, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', html: '' })

  useEffect(() => {
    let active = true
    const url = getExhibitUrl(exhibit)

    setState({ loading: true, error: '', html: '' })

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load exhibit.')
        return response.text()
      })
      .then((html) => {
        if (active) setState({ loading: false, error: '', html })
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message, html: '' })
      })

    return () => {
      active = false
    }
  }, [exhibit])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/60 p-3 sm:p-4">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-base-100 shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-base-300 p-4">
          <h2 className="text-xl font-black">{exhibit?.title || 'Exhibit'}</h2>
          <button className="btn btn-ghost btn-square btn-sm" type="button" onClick={onClose} aria-label="Close exhibit">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {state.loading ? (
            <div className="grid min-h-48 place-items-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : null}
          {state.error ? <div className="alert alert-error"><span>{state.error}</span></div> : null}
          {!state.loading && !state.error ? (
            <iframe
              className="h-[65vh] w-full rounded border border-base-300 bg-white"
              sandbox=""
              srcDoc={state.html}
              title={exhibit?.title || 'Exhibit'}
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}

function ExhibitButtons({ exhibits = [] }) {
  const [selectedExhibit, setSelectedExhibit] = useState(null)
  const firstExhibit = exhibits.find((exhibit) => exhibit?.fileName)

  if (!firstExhibit) return null

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={() => setSelectedExhibit(firstExhibit)}
        >
          <span className="material-symbols-outlined">description</span>
          Exhibit
        </button>
      </div>
      {selectedExhibit ? <ExhibitModal exhibit={selectedExhibit} onClose={() => setSelectedExhibit(null)} /> : null}
    </>
  )
}

function McqQuestionPage({ question, answer, submitted, onChange }) {
  const correctAnswer = getCorrectAnswer(question)

  return (
    <div id={`mcq-${question.questionId}`} className="h-full min-h-0">
      <div className="p-1">
        <ExhibitButtons exhibits={question.exhibits || []} />
        <ReferenceHtml
          as="p"
          className="mt-2 font-semibold"
          html={stripExhibitLink(question.questionText)}
        />
        <div className="form-control ml-2 mt-2 flex flex-col space-y-1">
          {(question.answerChoiceList || []).map((choice, index) => {
            const isCorrect = String(choice.choiceNumber) === correctAnswer
            const isSelected = String(choice.choiceNumber) === String(answer ?? '')
            const showIndicator = submitted && (isCorrect || isSelected)

            return (
              <label className="flex cursor-pointer items-center justify-start gap-2" data-choice={choice.choiceNumber} key={choice.choiceNumber}>
                <AnswerIndicator show={showIndicator} correct={isCorrect} />
                <input
                  type="radio"
                  name={`answer-${question.questionId}`}
                  className="radio radio-neutral radio-xs"
                  value={choice.choiceNumber}
                  checked={isSelected}
                  onChange={() => onChange(String(choice.choiceNumber))}
                  disabled={submitted}
                />
                <span className="ml-2">{index + 1}.</span>
                <span className="label-text" dangerouslySetInnerHTML={{ __html: choice.choice }} />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default McqQuestionPage
