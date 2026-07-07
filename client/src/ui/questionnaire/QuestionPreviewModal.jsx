import ExplanationPanel from './ExplanationPanel.jsx'
import ReferenceHtml from './ReferenceHtml.jsx'
import { getCorrectAnswer, stripExhibitLink } from './questionHelpers.js'

function getQuestionLabel(question) {
  return question?.questionId ? `QID ${question.questionId}` : 'Question preview'
}

function getTaxonomyItems(question) {
  return [
    question?.taxonomy?.subject || question?.subject,
    question?.taxonomy?.system || question?.system,
    question?.taxonomy?.topic || question?.topic,
    question?.taxonomy?.title || question?.title,
  ].filter(Boolean)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyPreviewHighlight(html, exact) {
  if (!html || !exact) {
    return html
  }

  const pattern = new RegExp(escapeRegExp(exact), 'i')
  return html.replace(pattern, (match) => `<mark class="rounded bg-warning/50 px-0.5">${match}</mark>`)
}

function isChoiceCorrect(choice, question) {
  const correctAnswers = getCorrectAnswer(question)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return correctAnswers.includes(String(choice.choiceNumber))
}

function PreviewSection({ children, title }) {
  if (!children) return null

  return (
    <section className="grid gap-2 border-t border-base-300 pt-4">
      <h3 className="text-sm font-black uppercase text-base-content/60">{title}</h3>
      {children}
    </section>
  )
}

function QuestionChoices({ question }) {
  const choices = question?.answerChoiceList || []

  if (choices.length === 0) {
    return null
  }

  return (
    <PreviewSection title="Options">
      <div className="grid gap-2">
        {choices.map((choice, index) => {
          const correct = isChoiceCorrect(choice, question)

          return (
            <div className="flex items-start gap-2 rounded border border-base-300 bg-base-100 p-3" key={choice.choiceNumber || index}>
              <span className="mt-0.5 inline-flex w-6 justify-center">
                {correct ? <span className="material-symbols-outlined text-success">check_circle</span> : null}
              </span>
              <span className="mt-0.5 text-sm font-bold">{index + 1}.</span>
              <ReferenceHtml html={choice.choice} className="min-w-0 flex-1 text-sm" />
            </div>
          )
        })}
      </div>
    </PreviewSection>
  )
}

function QuestionStandards({ standards = [] }) {
  if (!standards.length) {
    return null
  }

  return (
    <PreviewSection title="Standards">
      <div className="flex flex-wrap gap-2">
        {standards.map((standard, index) => (
          <span className="badge badge-outline h-auto whitespace-normal py-2 text-left" key={`${standard.header || standard.description || 'standard'}-${index}`}>
            {[standard.header, standard.description].filter(Boolean).join(': ')}
          </span>
        ))}
      </div>
    </PreviewSection>
  )
}

function QuestionExhibits({ exhibits = [] }) {
  const firstExhibit = exhibits.find((exhibit) => exhibit?.fileName || exhibit?.title)

  if (!firstExhibit) {
    return null
  }

  return (
    <PreviewSection title="Exhibits">
      <div className="flex flex-wrap gap-2">
        {firstExhibit.baseUrl && firstExhibit.fileName ? (
          <a className="btn btn-outline btn-sm" href={`${firstExhibit.baseUrl}${firstExhibit.fileName}`} rel="noreferrer" target="_blank">
            <span className="material-symbols-outlined">open_in_new</span>
            Exhibit
          </a>
        ) : (
          <span className="badge badge-outline h-auto py-2">Exhibit</span>
        )}
      </div>
    </PreviewSection>
  )
}

function OptionalHtmlSection({ html, title }) {
  if (!html) {
    return null
  }

  return (
    <PreviewSection title={title}>
      <ReferenceHtml html={html} className="text-sm" />
    </PreviewSection>
  )
}

function QuestionPreviewModal({ highlightText = '', onClose, question }) {
  const taxonomy = getTaxonomyItems(question)
  const questionHtml = question
    ? applyPreviewHighlight(stripExhibitLink(question.questionText), highlightText)
    : ''

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/60 p-3 sm:p-4">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-base-100 shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-base-300 p-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-primary">Question Preview</p>
            <h2 className="text-xl font-black sm:text-2xl">{getQuestionLabel(question)}</h2>
            {taxonomy.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {taxonomy.map((item) => <span className="badge badge-ghost" key={item}>{item}</span>)}
              </div>
            ) : null}
          </div>
          <button className="btn btn-ghost btn-square btn-sm shrink-0" type="button" onClick={onClose} aria-label="Close question preview">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!question ? (
            <div className="alert alert-warning"><span>No question is attached to this record.</span></div>
          ) : (
            <div className="grid gap-4">
              <PreviewSection title="Question">
                <ReferenceHtml html={questionHtml} className="text-sm font-semibold" />
              </PreviewSection>
              <OptionalHtmlSection html={question.answerHeader} title="Answer Header" />
              <OptionalHtmlSection html={question.additionalText} title="Additional Information" />
              <QuestionChoices question={question} />
              <PreviewSection title="Correct Answer">
                <p className="font-bold">{getCorrectAnswer(question) || '-'}</p>
              </PreviewSection>
              {question.explanationText ? <ExplanationPanel className="border-t border-base-300 pt-4" html={question.explanationText} /> : null}
              <OptionalHtmlSection html={question.scoringGuide} title="Scoring Guide" />
              <QuestionStandards standards={question.standards || []} />
              <QuestionExhibits exhibits={question.exhibits || []} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default QuestionPreviewModal
