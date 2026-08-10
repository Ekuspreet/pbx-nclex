import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getTestResult, listHighlights } from '../services/studyAdapter.js'
import { QuestionReviewScreen } from '../ui/questionnaire/QuestionReviewModal.jsx'
import { queryKeys } from '../services/queryKeys.js'

function TestReviewPage() {
  const { testId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(() => Number(location.state?.initialQuestion) || 0)
  const resultQuery = useQuery({ queryKey: queryKeys.testResult(testId), queryFn: ({ signal }) => getTestResult(testId, { signal }) })
  const highlightsQuery = useQuery({ queryKey: queryKeys.highlights({ testId }), queryFn: ({ signal }) => listHighlights({ testId }, { signal }) })
  const loading = resultQuery.isPending || highlightsQuery.isPending
  const error = resultQuery.error || highlightsQuery.error

  if (loading) return <main className="grid h-screen place-items-center bg-base-100" data-theme="nord"><span className="loading loading-spinner loading-lg text-primary" /></main>
  if (error) return <main className="grid h-screen place-items-center bg-base-100 p-6" data-theme="nord"><div className="alert alert-error max-w-xl"><span>{error.message}</span></div></main>

  const questions = resultQuery.data?.questions || []
  const item = questions[current]
  if (!item?.question) return <main className="grid h-screen place-items-center bg-base-100 p-6" data-theme="nord"><div className="alert alert-warning max-w-xl"><span>No questions are available for review.</span></div></main>

  const questionHighlights = (highlightsQuery.data?.highlights || []).filter((highlight) => String(highlight.questionId) === String(item.questionId))

  return (
    <main className="h-screen overflow-hidden">
      <QuestionReviewScreen
        key={item.id}
        answerState={{ value: item.answer ?? '', answered: Boolean(item.answered), submitted: true }}
        canNext={current < questions.length - 1}
        canPrevious={current > 0}
        current={current}
        initialHighlights={questionHighlights}
        question={item.question}
        questionCount={questions.length}
        onClose={() => navigate('/tests')}
        onNext={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}
        onPrevious={() => setCurrent((value) => Math.max(0, value - 1))}
      />
    </main>
  )
}

export default TestReviewPage
