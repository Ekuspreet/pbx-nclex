function TestShell({ bottomControls, children, mode = 'test', modals, navbar, navigator, theme, topBar }) {
  const reviewMode = mode === 'review'

  return (
    <div className={`test-page flex overflow-hidden bg-base-100 text-base-content ${reviewMode ? 'h-full' : 'h-screen'}`} data-theme={theme} data-screen-mode={mode}>
      {navigator}
      <main className="flex min-h-0 flex-1 flex-col">
        {topBar}
        {navbar}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-base-100 lg:flex-row lg:overflow-hidden">{children}</div>
        {bottomControls}
      </main>
      {modals}
    </div>
  )
}

export function TestPageState({ children, theme = 'nord' }) {
  return <main className="grid min-h-screen place-items-center bg-base-100 p-6" data-theme={theme}>{children}</main>
}

export default TestShell
