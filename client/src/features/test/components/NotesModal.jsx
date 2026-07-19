import { useEffect, useState } from 'react'
import { createNote, listNotes } from '../../../services/studyAdapter.js'
import Modal from './Modal.jsx'

function NotesModal({ onClose, onSaved, questionId, testId }) {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState({ title: '', content: '' })

  useEffect(() => {
    listNotes({ testId, questionId }).then((payload) => setNotes(payload.notes || []))
  }, [questionId, testId])

  const submit = async (event) => {
    event.preventDefault()
    await createNote({ testId, questionId, ...form })
    setForm({ title: '', content: '' })
    const payload = await listNotes({ testId, questionId })
    setNotes(payload.notes || [])
    onSaved?.()
  }

  return (
    <Modal title="Notes" onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <input className="input input-bordered" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <textarea className="textarea textarea-bordered min-h-32" placeholder="Content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <button className="btn btn-primary" disabled={!form.title || !form.content} type="submit">Save Note</button>
      </form>
      <div className="mt-4 grid gap-2">
        {notes.map((note) => (
          <article className="rounded border border-base-300 p-3" key={note.id}>
            <h3 className="font-bold">{note.title}</h3>
            <p className="text-sm text-muted">{note.content}</p>
          </article>
        ))}
      </div>
    </Modal>
  )
}

export default NotesModal
