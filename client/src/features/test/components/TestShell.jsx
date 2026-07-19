function TestShell({ bottomControls, children, modals, navbar, navigator, theme, topBar }) {
  return (
    <div className="flex h-screen bg-base-100 text-base-content" data-theme={theme}>
      {navigator}
      <main className="flex min-h-0 flex-1 flex-col border-l border-base-content/20">
        {topBar}
        {navbar}
        <div className="flex min-h-0 flex-1 overflow-hidden p-2">{children}</div>
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
