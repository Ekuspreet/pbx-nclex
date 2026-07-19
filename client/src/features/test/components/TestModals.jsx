import CalculatorModal from './CalculatorModal.jsx'
import FeedbackModal from './FeedbackModal.jsx'
import NotesModal from './NotesModal.jsx'

function TestModals({ activeModal, onClose, questionId, testId }) {
  if (activeModal === 'notes') {
    return <NotesModal questionId={questionId} testId={testId} onClose={onClose} />
  }

  if (activeModal === 'feedback') {
    return <FeedbackModal questionId={questionId} testId={testId} onClose={onClose} />
  }

  if (activeModal === 'calculator') {
    return <CalculatorModal onClose={onClose} />
  }

  return null
}

export default TestModals
