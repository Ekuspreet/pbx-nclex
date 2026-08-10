import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { listHighlights } from '../services/studyAdapter.js'
import { QuestionReviewScreen } from '../ui/questionnaire/QuestionReviewModal.jsx'
import { queryKeys } from '../services/queryKeys.js'

function QuestionReviewPage() {
  const { highlightId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const initialHighlight = location.state?.highlight
  const highlightsQuery = useQuery({ queryKey: queryKeys.highlights(), queryFn: ({ signal }) => listHighlights({}, { signal }), enabled: !initialHighlight })
  const highlight = initialHighlight || (highlightsQuery.data?.highlights || []).find((item) => String(item.id) === String(highlightId))
  const error = highlightsQuery.error?.message || (!highlightsQuery.isPending && !highlight ? 'This highlighted question is unavailable.' : '')

  const close = () => navigate('/highlights')

  if (!initialHighlight && highlightsQuery.isPending) {
    return <main className="grid h-screen place-items-center bg-base-100" data-theme="nord"><span className="loading loading-spinner loading-lg text-primary" /></main>
  }

  if (error || !highlight?.question) {
    return (
      <main className="grid h-screen place-items-center bg-base-100 p-6" data-theme="nord">
        <div className="grid max-w-xl gap-4"><div className="alert alert-warning"><span>{error || 'No question is attached to this highlight.'}</span></div><button className="btn btn-primary justify-self-center" type="button" onClick={close}>Back to highlights</button></div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden">
      <QuestionReviewScreen initialHighlights={[highlight]} question={highlight.question} onClose={close} />
    </main>
  )
}

export default QuestionReviewPage
