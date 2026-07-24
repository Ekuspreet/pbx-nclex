import { useEffect, useMemo, useState } from 'react'
import { listNotes } from '../../../services/studyAdapter.js'

function normalizeNoteText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function paginateNotes(notes) {
  const pages = [[]]
  let usedLines = 0

  for (const note of notes) {
    const content = normalizeNoteText(note.content)
    const estimatedLines = Math.max(1, Math.ceil(content.length / 72))

    if (usedLines > 0 && usedLines + estimatedLines > 16) {
      pages.push([])
      usedLines = 0
    }

    pages.at(-1).push({ ...note, content })
    usedLines += estimatedLines
  }

  if (pages.length % 2 !== 0) pages.push([])
  return pages
}

function NotebookPage({ notes }) {
  return (
    <div className="relative min-h-[620px] flex-1 bg-base-100 px-5 pb-8 pt-3 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--color-base-300)_32px)]">
      <div className="absolute inset-y-0 left-[70px] w-px bg-error/50" />
      <div className="grid h-12 grid-cols-[70px_1fr] items-end border-b-2 border-base-content/70 font-bold">
        <span className="px-1 leading-5">Que.<br />No.</span><span className="px-4 pb-1">Notes</span>
      </div>
      <div>
        {notes.map((note) => (
          <div className="grid min-h-8 grid-cols-[70px_1fr] text-sm leading-8" key={note.id}>
            <strong className="px-1">{note.question?.questionId || '—'}</strong>
            <p className="break-words px-4 leading-8">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotebookViewer({ error = '', loading = false, notes = [], onClose }) {
  const [spread, setSpread] = useState(0)

  const pages = useMemo(() => {
    return paginateNotes(notes)
  }, [notes])
  const spreadCount = Math.max(1, Math.ceil(pages.length / 2))
  const leftPage = spread * 2

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base-200/95 p-5 md:p-10" role="presentation">
      <section className="mx-auto w-full max-w-[1460px]" role="dialog" aria-modal="true" aria-label="Notebook">
        <header className="relative mb-6 text-center">
          <h1 className="font-serif text-4xl text-base-content md:text-5xl">Notebook</h1>
          <div className="absolute left-0 top-0 flex items-center gap-3">
            <button className="btn btn-primary" disabled={spread === 0} type="button" onClick={() => setSpread((value) => Math.max(0, value - 1))}><span className="material-symbols-outlined">arrow_back</span>Previous</button>
            <span className="text-sm text-base-content/60">Pages {leftPage + 1}–{leftPage + 2} of {pages.length}</span>
          </div>
          <button className="btn btn-circle btn-primary absolute right-0 top-0" type="button" aria-label="Close notebook" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
        </header>
        {loading ? <div className="grid min-h-96 place-items-center"><span className="loading loading-spinner loading-lg text-primary" /></div> : null}
        {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
        {!loading && !error ? (
          <div className="flex overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl">
            <NotebookPage notes={pages[leftPage] || []} />
            <div className="w-6 shrink-0 border-x border-base-content/30 bg-gradient-to-r from-base-content/20 via-base-100 to-base-content/20 shadow-inner" />
            <NotebookPage notes={pages[leftPage + 1] || []} />
          </div>
        ) : null}
        {!loading && !error ? (
          <div className="mt-5 flex justify-end">
            <button className="btn btn-primary" disabled={spread >= spreadCount - 1} type="button" onClick={() => setSpread((value) => Math.min(spreadCount - 1, value + 1))}>Next<span className="material-symbols-outlined">arrow_forward</span></button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function NotesModal({ onClose, testId }) {
  const [state, setState] = useState({ loading: true, error: '', notes: [] })

  useEffect(() => {
    let active = true
    listNotes({ testId })
      .then((payload) => active && setState({ loading: false, error: '', notes: payload.notes || [] }))
      .catch((error) => active && setState({ loading: false, error: error.message, notes: [] }))
    return () => { active = false }
  }, [testId])

  return <NotebookViewer error={state.error} loading={state.loading} notes={state.notes} onClose={onClose} />
}

export default NotesModal
