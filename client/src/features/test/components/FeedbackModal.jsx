import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFeedback } from '../../../services/studyAdapter.js'
import { queryKeys } from '../../../services/queryKeys.js'
import Modal from './Modal.jsx'

function FeedbackModal({ onClose, questionId, testId }) {
  const [form, setForm] = useState({ subject: 'Question feedback', message: '' })
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()
  const feedbackMutation = useMutation({ mutationFn: createFeedback })

  const submit = async (event) => {
    event.preventDefault()
    await feedbackMutation.mutateAsync({ testId, questionId, ...form })
    await queryClient.invalidateQueries({ queryKey: queryKeys.feedback })
    setSaved(true)
  }

  return (
    <Modal title="Feedback" onClose={onClose}>
      {saved ? (
        <div className="alert alert-success"><span>Feedback submitted.</span></div>
      ) : (
        <form className="grid gap-3" onSubmit={submit}>
          <input className="input input-bordered" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
          <textarea className="textarea textarea-bordered min-h-40" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          <button className="btn btn-primary" disabled={!form.message || feedbackMutation.isPending} type="submit">Send</button>
        </form>
      )}
    </Modal>
  )
}

export default FeedbackModal
