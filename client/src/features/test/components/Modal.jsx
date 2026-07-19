function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/60 p-4">
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-base-100 p-4 shadow-xl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-h3">{title}</h2>
          <button className="btn btn-ghost btn-square btn-sm" type="button" aria-label={`Close ${title}`} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export default Modal
