import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AnswerIndicator from '../../../ui/questionnaire/AnswerIndicator.jsx'
import ReferenceHtml from '../../../ui/questionnaire/ReferenceHtml.jsx'
import { getCorrectAnswer, stripExhibitLink } from '../../../ui/questionnaire/questionHelpers.js'
import { queryKeys } from '../../../services/queryKeys.js'

function getApiOrigin() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

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
  const url = getExhibitUrl(exhibit)
  const exhibitQuery = useQuery({
    queryKey: queryKeys.exhibit(url),
    queryFn: async ({ signal }) => {
      const response = await fetch(url, { signal })
        if (!response.ok) throw new Error('Unable to load exhibit.')
      return response.text()
    },
    enabled: Boolean(url),
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/60 p-3 sm:p-4">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-base-100 shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-test-bar-content/40 bg-test-bar p-4 text-test-bar-content">
          <h2 className="text-xl font-black">{exhibit?.title || 'Exhibit'}</h2>
          <button className="btn btn-ghost btn-square btn-sm" type="button" onClick={onClose} aria-label="Close exhibit">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {exhibitQuery.isPending ? (
            <div className="grid min-h-48 place-items-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : null}
          {exhibitQuery.isError ? <div className="alert alert-error"><span>{exhibitQuery.error.message}</span></div> : null}
          {!exhibitQuery.isPending && !exhibitQuery.isError ? (
            <iframe
              className="h-[65vh] w-full rounded border border-base-300 bg-white"
              sandbox="allow-scripts"
              srcDoc={exhibitQuery.data}
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
          className="mt-4 ml-2 inline-flex h-8 items-center justify-center gap-1.5 bg-test-toolbar px-3 text-sm font-bold leading-none text-test-bar-content disabled:cursor-not-allowed"
          type="button"
          onClick={() => setSelectedExhibit(firstExhibit)}
        >
          <span className="material-symbols-outlined !text-[20px] leading-none">description</span>
          Exhibit
        </button>
      </div>
      {selectedExhibit ? <ExhibitModal exhibit={selectedExhibit} onClose={() => setSelectedExhibit(null)} /> : null}
    </>
  )
}

function McqQuestionPage({ question, answer, submitted, onChange }) {
  const correctAnswer = getCorrectAnswer(question)
  const [crossedChoices, setCrossedChoices] = useState(() => new Set())
  const longPressTimer = useRef(null)
  const pressStart = useRef(null)
  const suppressChoiceClick = useRef(false)

  const cancelLongPress = () => {
    window.clearTimeout(longPressTimer.current)
    longPressTimer.current = null
    pressStart.current = null
  }

  useEffect(() => {
    setCrossedChoices(new Set())
    cancelLongPress()
    suppressChoiceClick.current = false

    return cancelLongPress
  }, [question.questionId])

  const startLongPress = (event, choiceNumber) => {
    if (event.button !== undefined && event.button !== 0) return

    cancelLongPress()
    suppressChoiceClick.current = false
    pressStart.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => {
      setCrossedChoices((currentChoices) => {
        const nextChoices = new Set(currentChoices)
        if (nextChoices.has(choiceNumber)) nextChoices.delete(choiceNumber)
        else nextChoices.add(choiceNumber)
        return nextChoices
      })
      suppressChoiceClick.current = true
      longPressTimer.current = null
    }, 600)
  }

  const moveLongPress = (event) => {
    if (!pressStart.current) return
    const distance = Math.hypot(event.clientX - pressStart.current.x, event.clientY - pressStart.current.y)
    if (distance > 8) cancelLongPress()
  }

  const handleChoiceClick = (event) => {
    if (!suppressChoiceClick.current) return
    event.preventDefault()
    event.stopPropagation()
    suppressChoiceClick.current = false
  }

  return (
    <div id={`mcq-${question.questionId}`} className="h-full min-h-0">
      <div>
        <ExhibitButtons exhibits={question.exhibits || []} />
        <ReferenceHtml
          as="p"
          className="font-normal leading-[1.6]"
          html={stripExhibitLink(question.questionText)}
        />
        <div className="form-control flex flex-col">
          {(question.answerChoiceList || []).map((choice) => {
            const isCorrect = String(choice.choiceNumber) === correctAnswer
            const isSelected = String(choice.choiceNumber) === String(answer ?? '')
            const showIndicator = submitted && (isCorrect || isSelected)

            return (
              <label className="relative mb-2 flex min-h-[46px] cursor-pointer items-center py-2 pl-[54px] pr-[5px] leading-[1.3]" data-choice={choice.choiceNumber} key={choice.choiceNumber}>
                <AnswerIndicator className="absolute left-0 top-1/2 z-10 -translate-y-1/2" show={showIndicator} correct={isCorrect} />
                <input
                  type="radio"
                  name={`answer-${question.questionId}`}
                  className="test-option-input absolute left-[22px] top-1/2 size-[26px] -translate-y-1/2 appearance-none rounded-[5px] border-2 border-base-100 bg-base-100 shadow-[inset_0_0_0_1px_rgb(65_65_65/0.33)] checked:border-base-100 checked:bg-test-toolbar checked:shadow-[inset_0_0_0_1px_rgb(65_65_65/0.33),inset_0_0_0_5px_white]"
                  value={choice.choiceNumber}
                  checked={isSelected}
                  onChange={() => onChange(String(choice.choiceNumber))}
                  disabled={submitted}
                />
                <ReferenceHtml
                  as="span"
                  className={`label-text block w-full ${crossedChoices.has(choice.choiceNumber) ? 'line-through opacity-60' : ''}`}
                  onClick={handleChoiceClick}
                  onContextMenu={(event) => suppressChoiceClick.current && event.preventDefault()}
                  onPointerCancel={cancelLongPress}
                  onPointerDown={(event) => startLongPress(event, choice.choiceNumber)}
                  onPointerLeave={cancelLongPress}
                  onPointerMove={moveLongPress}
                  onPointerUp={cancelLongPress}
                  html={choice.choice}
                />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default McqQuestionPage
