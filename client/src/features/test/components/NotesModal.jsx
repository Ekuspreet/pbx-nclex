import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createHighlight, createNote, deleteHighlight, deleteNote, listHighlights, listNotes } from '../../../services/studyAdapter.js'
import { queryKeys } from '../../../services/queryKeys.js'
import { applyHighlightsToHtml, createHighlightSelector } from '../testUtils.js'

function normalizeNoteText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function paginateNotes(notes) {
  const pages = [[]]
  let usedLines = 0
  const chronologicalNotes = [...notes].sort((first, second) => {
    const firstTimestamp = new Date(first.createdAt || first.updatedAt || 0).getTime()
    const secondTimestamp = new Date(second.createdAt || second.updatedAt || 0).getTime()
    return firstTimestamp - secondTimestamp
  })

  for (const note of chronologicalNotes) {
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

function NotebookNote({ highlights, note, onAddHighlight, onDeleteHighlight, onDeleteNote, deletingNoteId }) {
  const contentRef = useRef(null)
  const [selection, setSelection] = useState(null)
  const region = `note:${note.id}`
  const html = applyHighlightsToHtml(escapeHtml(note.content), highlights, region)

  const captureSelection = () => {
    const activeSelection = window.getSelection()
    const exact = activeSelection?.toString().trim()
    if (!exact || !contentRef.current?.contains(activeSelection.anchorNode)) {
      setSelection(null)
      return
    }

    const range = activeSelection.getRangeAt(0)
    const selector = createHighlightSelector(contentRef.current, range, region)
    if (!selector) return
    const bounds = range.getBoundingClientRect()
    const highlightIds = [...contentRef.current.querySelectorAll('[data-highlight-id]')]
      .filter((mark) => range.intersectsNode(mark))
      .map((mark) => mark.dataset.highlightId)
    setSelection({ selector, highlightIds, left: bounds.left, top: bounds.top })
  }

  const runHighlightAction = async () => {
    const highlightIds = selection?.highlightIds || []
    const selector = selection?.selector
    if (!selector || typeof onAddHighlight !== 'function' || typeof onDeleteHighlight !== 'function') return
    setSelection(null)
    if (highlightIds.length > 0) await onDeleteHighlight(highlightIds)
    else await onAddHighlight(note, selector)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div className="relative grid min-h-8 grid-cols-[70px_1fr_auto] text-sm leading-8">
      <strong className="px-1">{note.question?.questionId || '—'}</strong>
      <p ref={contentRef} className="break-words px-4 leading-8" onMouseUp={onAddHighlight ? captureSelection : undefined} dangerouslySetInnerHTML={{ __html: html }} />
      {onDeleteNote ? <button className="btn btn-ghost btn-sm btn-square my-0.5 text-error" disabled={deletingNoteId === note.id} type="button" aria-label="Delete note" onClick={() => onDeleteNote(note.id)}>{deletingNoteId === note.id ? <span className="loading loading-spinner loading-xs" /> : <span className="material-symbols-outlined !text-[18px]">delete</span>}</button> : null}
      {selection ? (
        <div className="fixed z-[60] -translate-y-full rounded-md border border-base-300 bg-base-100 p-1 text-sm text-base-content shadow-xl" style={{ left: selection.left, top: selection.top }} onMouseDown={(event) => event.preventDefault()}>
          <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={runHighlightAction}><span className="material-symbols-outlined !text-[17px]">{selection.highlightIds.length > 0 ? 'format_color_reset' : 'highlight'}</span>{selection.highlightIds.length > 0 ? 'Unhighlight' : 'Highlight'}</button>
        </div>
      ) : null}
    </div>
  )
}

function NotebookPage({ composer, deletingNoteId, highlights, notes, onAddHighlight, onDeleteHighlight, onDeleteNote }) {
  return (
    <div className="relative min-h-[660px] flex-1 bg-base-100 px-6 pb-8 pt-3 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--color-base-300)_32px)]">
      <div className="absolute inset-y-0 left-[70px] w-px bg-error/50" />
      <div className="grid h-12 grid-cols-[70px_1fr] items-end border-b-2 border-base-content/70 font-bold">
        <span className="px-1 leading-5">Que.<br />No.</span><span className="px-4 pb-1">Notes</span>
      </div>
      <div>
        {notes.map((note) => <NotebookNote deletingNoteId={deletingNoteId} highlights={highlights} key={note.id} note={note} onAddHighlight={onAddHighlight} onDeleteHighlight={onDeleteHighlight} onDeleteNote={onDeleteNote} />)}
        {composer}
      </div>
    </div>
  )
}

export function NotebookViewer({ composer = null, deletingNoteId = '', error = '', highlights = [], loading = false, notes = [], onAddHighlight, onClose, onDeleteHighlight, onDeleteNote }) {
  const [spread, setSpread] = useState(0)

  const pages = useMemo(() => {
    return paginateNotes(notes)
  }, [notes])
  const spreadCount = Math.max(1, Math.ceil(pages.length / 2))
  const leftPage = spread * 2
  const lastNotePage = Math.max(0, pages.findLastIndex((page) => page.length > 0))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base-200/95 p-5 md:p-10" role="presentation">
      <section className="mx-auto w-full max-w-[1520px]" role="dialog" aria-modal="true" aria-label="Notebook">
        <header className="relative mb-6 text-center">
          <h1 className="font-serif text-4xl text-base-content md:text-5xl">Notebook</h1>
          <button className="btn btn-circle btn-primary absolute right-0 top-0" type="button" aria-label="Close notebook" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
        </header>
        {loading ? <div className="grid min-h-96 place-items-center"><span className="loading loading-spinner loading-lg text-primary" /></div> : null}
        {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
        {!loading && !error ? (
          <div className="flex overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl">
            <NotebookPage composer={leftPage === lastNotePage ? composer : null} deletingNoteId={deletingNoteId} highlights={highlights} notes={pages[leftPage] || []} onAddHighlight={onAddHighlight} onDeleteHighlight={onDeleteHighlight} onDeleteNote={onDeleteNote} />
            <div className="w-6 shrink-0 border-x border-base-content/30 bg-gradient-to-r from-base-content/20 via-base-100 to-base-content/20 shadow-inner" />
            <NotebookPage composer={leftPage + 1 === lastNotePage ? composer : null} deletingNoteId={deletingNoteId} highlights={highlights} notes={pages[leftPage + 1] || []} onAddHighlight={onAddHighlight} onDeleteHighlight={onDeleteHighlight} onDeleteNote={onDeleteNote} />
          </div>
        ) : null}
        {!loading && !error ? (
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-sm text-base-content/60">Pages {leftPage + 1}–{leftPage + 2} of {pages.length}</span>
            <div className="flex items-center gap-3">
              <button className="btn btn-primary" disabled={spread === 0} type="button" onClick={() => setSpread((value) => Math.max(0, value - 1))}><span className="material-symbols-outlined">arrow_back</span>Previous</button>
              <button className="btn btn-primary" disabled={spread >= spreadCount - 1} type="button" onClick={() => setSpread((value) => Math.min(spreadCount - 1, value + 1))}>Next<span className="material-symbols-outlined">arrow_forward</span></button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function NotesModal({ onClose, questionId, testId }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const params = { testId }
  const notesKey = queryKeys.notes(params)
  const highlightsKey = queryKeys.highlights(params)
  const notesQuery = useQuery({ queryKey: notesKey, queryFn: ({ signal }) => listNotes(params, { signal }) })
  const highlightsQuery = useQuery({ queryKey: highlightsKey, queryFn: ({ signal }) => listHighlights(params, { signal }) })
  const createNoteMutation = useMutation({ mutationFn: createNote })
  const deleteNoteMutation = useMutation({ mutationFn: deleteNote })
  const createHighlightMutation = useMutation({ mutationFn: createHighlight })
  const deleteHighlightMutation = useMutation({ mutationFn: deleteHighlight })
  const notes = notesQuery.data?.notes || []
  const highlights = highlightsQuery.data?.highlights || []

  const removeNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await deleteNoteMutation.mutateAsync(noteId)
      queryClient.setQueryData(notesKey, (current) => ({ ...current, notes: (current?.notes || []).filter((note) => note.id !== noteId) }))
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
    } catch { /* surfaced by the mutation below */ }
  }

  const saveManualNote = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !questionId) return
    try {
      const payload = await createNoteMutation.mutateAsync({
        testId,
        questionId,
        title: 'Manual note',
        content,
      })
      queryClient.setQueryData(notesKey, (current) => ({ ...current, notes: [...(current?.notes || []), payload.note] }))
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      setDraft('')
    } catch { /* surfaced by the mutation below */ }
  }

  const addNoteHighlight = async (note, selector) => {
    const payload = await createHighlightMutation.mutateAsync({ testId, questionId: note.questionId, selector, color: 'yellow' })
    queryClient.setQueryData(highlightsKey, (current) => ({ ...current, highlights: [...(current?.highlights || []), payload.highlight] }))
    await queryClient.invalidateQueries({ queryKey: ['highlights'] })
  }

  const removeNoteHighlights = async (highlightIds) => {
    const ids = [...new Set(highlightIds)].filter(Boolean)
    await Promise.all(ids.map((highlightId) => deleteHighlightMutation.mutateAsync(highlightId)))
    queryClient.setQueryData(highlightsKey, (current) => ({ ...current, highlights: (current?.highlights || []).filter((highlight) => !ids.includes(highlight.id)) }))
    await queryClient.invalidateQueries({ queryKey: ['highlights'] })
  }

  const composer = (
    <form className="grid min-h-12 grid-cols-[70px_1fr_auto] items-start py-1" onSubmit={saveManualNote}>
      <span aria-hidden="true" />
      <textarea className="textarea textarea-ghost mx-2 min-h-10 resize-y bg-base-100/80 px-2 py-1 leading-6" disabled={createNoteMutation.isPending} maxLength={20000} placeholder="Write a note…" required value={draft} onChange={(event) => setDraft(event.target.value)} />
      <button className="btn btn-primary btn-sm mt-1" disabled={createNoteMutation.isPending || !draft.trim()} type="submit">{createNoteMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <span className="material-symbols-outlined !text-[18px]">add</span>}Add</button>
    </form>
  )

  const error = notesQuery.error || createNoteMutation.error || deleteNoteMutation.error || createHighlightMutation.error || deleteHighlightMutation.error
  return <NotebookViewer composer={composer} deletingNoteId={deleteNoteMutation.isPending ? deleteNoteMutation.variables : ''} error={error?.message || ''} highlights={highlights} loading={notesQuery.isPending} notes={notes} onAddHighlight={addNoteHighlight} onClose={onClose} onDeleteHighlight={removeNoteHighlights} onDeleteNote={removeNote} />
}

export default NotesModal
