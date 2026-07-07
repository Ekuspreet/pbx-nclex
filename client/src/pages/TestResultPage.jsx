import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTestResult } from '../services/studyAdapter.js'
import ExplanationPanel from '../ui/questionnaire/ExplanationPanel.jsx'
import ReferenceHtml from '../ui/questionnaire/ReferenceHtml.jsx'

function LoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100" data-theme="nord">
      <span className="loading loading-spinner loading-lg text-primary" />
    </main>
  )
}

function BreakdownTable({ rows = [], title }) {
  return (
    <section className="surface-raised rounded-lg border p-4">
      <h2 className="text-h3 mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total</th>
              <th>Attempted</th>
              <th>Correct</th>
              <th>Incorrect</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{row.total}</td>
                <td>{row.attempted ?? row.total - row.unanswered}</td>
                <td>{row.correct}</td>
                <td>{row.incorrect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TestResultPage() {
  const { testId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    getTestResult(testId)
      .then((data) => setState({ loading: false, error: '', data }))
      .catch((error) => setState({ loading: false, error: error.message, data: null }))
  }, [testId])

  if (state.loading) return <LoadingState />
  if (state.error) {
    return <main className="grid min-h-screen place-items-center bg-base-100 p-6" data-theme="nord"><div className="alert alert-error max-w-xl"><span>{state.error}</span></div></main>
  }

  const { scoreSummary } = state.data
  const attempted = scoreSummary.answered ?? scoreSummary.total - scoreSummary.unanswered

  return (
    <main className="surface-muted min-h-screen py-10" data-theme="nord">
      <section className="container-page grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-kicker">Results</p>
            <h1 className="text-h2">Test Result</h1>
          </div>
          <Link className="btn btn-primary" to="/home">Dashboard</Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="card surface-raised"><div className="card-body"><p className="text-caption text-muted">Total</p><strong className="text-h3">{scoreSummary.total}</strong></div></article>
          <article className="card surface-raised"><div className="card-body"><p className="text-caption text-muted">Attempted</p><strong className="text-h3">{attempted}</strong></div></article>
          <article className="card surface-raised"><div className="card-body"><p className="text-caption text-muted">Correct</p><strong className="text-h3">{scoreSummary.correct}</strong></div></article>
          <article className="card surface-raised"><div className="card-body"><p className="text-caption text-muted">Incorrect</p><strong className="text-h3">{scoreSummary.incorrect}</strong></div></article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <BreakdownTable rows={scoreSummary.subjects} title="Subject Performance" />
          <BreakdownTable rows={scoreSummary.systems} title="System Performance" />
        </section>

        <section className="grid gap-4">
          <h2 className="text-h3">Question Review</h2>
          {state.data.questions.map((item, index) => (
            <article className="surface-raised rounded-lg border p-4" key={item.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-black">Question {index + 1} · QID {item.question.questionId}</h3>
                <span className={`badge ${item.isCorrect ? 'badge-success' : item.answered ? 'badge-error' : 'badge-warning'}`}>
                  {item.isCorrect ? 'Correct' : item.answered ? 'Incorrect' : 'Unanswered'}
                </span>
              </div>
              <ReferenceHtml html={item.question.questionText} />
              <p className="mt-3 text-sm font-bold">Your answer: {String(item.answer ?? '-')}</p>
              <p className="text-sm font-bold">Correct answer: {item.question.correctAnswer}</p>
              <ExplanationPanel className="mt-4" html={item.question.explanationText} />
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}

export default TestResultPage
