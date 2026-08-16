import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getTestResult } from '../services/studyAdapter.js'
import { queryKeys } from '../services/queryKeys.js'

function formatDuration(ms) {
  const seconds = Math.max(0, Math.round((ms || 0) / 1000))
  if (seconds < 60) return `${seconds} sec`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function LoadingState() {
  return <main className="grid min-h-screen place-items-center bg-[#f8fafc]" data-theme="nord"><span className="loading loading-spinner loading-lg text-primary" /></main>
}

function StatusIcon({ item }) {
  if (item.isCorrect) return <span className="material-symbols-outlined !text-[22px] text-success" aria-label="Correct">check</span>
  if (item.answered) return <span className="material-symbols-outlined !text-[22px] text-error" aria-label="Incorrect">close</span>
  return <span className="text-xl font-black text-neutral/75">−</span>
}

function CountRow({ className, count, label }) {
  return (
    <div className="flex items-center justify-between border-b border-base-300 pb-3 text-[15px] text-base-content/80">
      <span>{label}</span><span className={`grid size-[30px] place-items-center rounded-full text-sm font-bold ${className}`}>{count}</span>
    </div>
  )
}

function TestResultPage() {
  const { testId } = useParams()
  const resultQuery = useQuery({ queryKey: queryKeys.testResult(testId), queryFn: ({ signal }) => getTestResult(testId, { signal }) })

  if (resultQuery.isPending) return <LoadingState />
  if (resultQuery.isError) return <main className="grid min-h-screen place-items-center bg-[#f8fafc] p-6" data-theme="nord"><div className="alert alert-error max-w-xl"><span>{resultQuery.error.message}</span></div></main>

  const { questions = [], scoreSummary, test } = resultQuery.data
  const total = Number(scoreSummary.total || questions.length || 0)
  const correct = Number(scoreSummary.correct || 0)
  const incorrect = Number(scoreSummary.incorrect || 0)
  const omitted = Number(scoreSummary.unanswered ?? Math.max(0, total - correct - incorrect))
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalQuestionTimeMs = questions.reduce((sum, item) => sum + Number(item.timeSpentMs || 0), 0)
  const averageMs = total > 0 ? totalQuestionTimeMs / total : 0

  return (
    <main className="min-h-screen bg-base-200 px-5 py-10 text-base-content sm:px-10 lg:px-16" data-theme="nord">
      <div className="mx-auto max-w-[1465px]">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-base-content">Test Results</h1>
          <Link className="btn btn-primary h-[42px] w-[130px]" to="/home">Dashboard</Link>
        </header>
        <div className="mb-10 mt-8 border-b border-base-300" />

        <section className="rounded-2xl border border-base-300 bg-base-100 p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1.5fr]">
            <div>
              <div className="flex items-center gap-6 text-[15px] font-semibold text-slate-600"><span>Points Scored</span><strong className="text-lg text-slate-900">{correct} / {total}</strong></div>
              <div className="relative mt-8 h-[14px] max-w-[280px] rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-success" style={{ width: `${percentage}%` }} />
                <div className="absolute -top-7 flex -translate-x-1/2 flex-col items-center" style={{ left: `${percentage}%` }}>
                  <span className="rounded border border-base-300 bg-base-100 px-1.5 py-0.5 text-xs font-extrabold text-success">{percentage}%</span>
                  <span className="mt-0.5 border-x-[6px] border-t-[7px] border-x-transparent border-t-success" />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <CountRow className="bg-success text-white" count={correct} label="Correct" />
              <CountRow className="bg-error text-white" count={incorrect} label="Incorrect" />
              <CountRow className="bg-neutral/75 text-white" count={omitted} label="Omitted" />
            </div>

            <div className="grid content-start gap-4">
              <h2 className="text-lg font-bold text-slate-950">Session Details</h2>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm text-slate-600"><span>Test Id</span><span className="max-w-[220px] truncate rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-700" title={test.id}>{test.id}</span></div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm text-slate-600"><span>Mode</span><div className="flex gap-2"><span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-700">{test.tutorMode ? 'Tutored' : 'Untutored'}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-700">{test.timed ? 'Timed' : 'Untimed'}</span></div></div>
              <Link className="btn btn-primary w-full" to={`/tests/${testId}/review`}>Review</Link>
            </div>
          </div>

          <h2 className="mb-4 mt-14 text-lg font-bold text-slate-950">Question Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left">
              <thead><tr className="text-xs font-bold uppercase tracking-wide text-slate-600"><th className="w-12 border-b-2 border-slate-200 p-4" /><th className="border-b-2 border-slate-200 p-4">ID</th><th className="border-b-2 border-slate-200 p-4">Subjects</th><th className="border-b-2 border-slate-200 p-4">Systems</th><th className="border-b-2 border-slate-200 p-4">Topics</th><th className="border-b-2 border-slate-200 p-4">Client Needs</th><th className="border-b-2 border-slate-200 p-4">Scored / Max</th><th className="border-b-2 border-slate-200 p-4">Time</th><th className="border-b-2 border-slate-200 p-4">Avg. Time</th><th className="border-b-2 border-slate-200 p-4" /></tr></thead>
              <tbody>
                {questions.map((item, index) => (
                  <tr className="text-sm font-medium text-slate-700 hover:bg-slate-50" key={item.id}>
                    <td className="border-b border-slate-100 p-4 text-center"><StatusIcon item={item} /></td>
                    <td className="border-b border-slate-100 p-4">{item.question.questionId}</td>
                    <td className="border-b border-slate-100 p-4">{item.question.subject || '—'}</td>
                    <td className="border-b border-slate-100 p-4">{item.question.system || '—'}</td>
                    <td className="border-b border-slate-100 p-4">{item.question.topic || '—'}</td>
                    <td className="border-b border-slate-100 p-4">{item.question.title || '—'}</td>
                    <td className="border-b border-slate-100 p-4">{item.isCorrect ? 1 : 0} / 1</td>
                    <td className="border-b border-slate-100 p-4">{formatDuration(item.timeSpentMs)}</td>
                    <td className="border-b border-slate-100 p-4">{formatDuration(averageMs)}</td>
                    <td className="border-b border-slate-100 p-4 text-right"><Link className="px-3 text-xl text-slate-400 hover:text-primary" to={`/tests/${testId}/review`} state={{ initialQuestion: index }} aria-label={`Review question ${index + 1}`}>›</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <footer className="py-16 text-center text-sm text-slate-400">Copyright © PBX Nursing. All rights reserved.</footer>
      </div>
    </main>
  )
}

export default TestResultPage
