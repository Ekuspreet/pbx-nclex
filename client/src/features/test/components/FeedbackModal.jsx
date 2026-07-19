import { useState } from 'react'
import { createFeedback } from '../../../services/studyAdapter.js'
import Modal from './Modal.jsx'

function FeedbackModal({ onClose, questionId, testId }) {
  const [form, setForm] = useState({ subject: 'Question feedback', message: '' })
  const [saved, setSaved] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    await createFeedback({ testId, questionId, ...form })
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
          <button className="btn btn-primary" disabled={!form.message} type="submit">Send</button>
        </form>
      )}
    </Modal>
  )
}

export default FeedbackModal
