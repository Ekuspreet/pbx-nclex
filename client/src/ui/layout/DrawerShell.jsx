import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function SidebarIcon({ name }) {
  const common = {
    className: 'size-[18px] shrink-0',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  }

  if (name === 'dashboard') return <svg {...common}><rect height="7" width="7" x="3" y="3" /><rect height="7" width="7" x="14" y="3" /><rect height="7" width="7" x="14" y="14" /><rect height="7" width="7" x="3" y="14" /></svg>
  if (name === 'analytics') return <svg {...common}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
  if (name === 'add_circle') return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="16" /><line x1="8" x2="16" y1="12" y2="12" /></svg>
  if (name === 'description') return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>
  if (name === 'format_list_bulleted') return <svg {...common}><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
  return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}

function SidebarLink({ item, onNavigate }) {
  return (
    <NavLink
      className={({ isActive }) => [
        '!flex min-h-[42px] !w-full !gap-3.5 rounded-lg border-l-[3px] !px-4 !py-3 font-medium transition-colors duration-150',
        isActive
          ? 'border-primary !bg-primary/15 !text-neutral-content'
          : 'border-transparent !text-neutral-content/60 hover:!bg-neutral-content/7 hover:!text-neutral-content',
      ].join(' ')}
      end={item.end}
      onClick={onNavigate}
      to={item.href}
    >
      <SidebarIcon name={item.icon} />
      {item.label}
    </NavLink>
  )
}

export function AccountPanel({ name }) {
  return (
    <section className="border-t border-neutral-content/10 pt-2">
      <Link className="flex w-full items-center gap-3 rounded-lg p-2 text-neutral-content transition-colors hover:bg-neutral-content/7" to="/profile">
        <div className="avatar avatar-placeholder shrink-0"><div className="w-10 rounded-full bg-primary text-primary-content"><span className="text-xs font-bold">{getInitials(name)}</span></div></div>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-bold">{name}</p>
          <p className="text-xs text-neutral-content/60">22 Days Left</p>
        </div>
      </Link>
    </section>
  )
}

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export function AccountIdentity({ badge, caption, name, to }) {
  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="avatar avatar-placeholder shrink-0" aria-label={`${name} profile`}>
        <div className="w-11 rounded-full bg-primary text-primary-content">
          <span className="text-sm font-black">{getInitials(name)}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-black">{name}</p>
          {badge ? <span className={`badge badge-sm shrink-0 ${badge.className || 'badge-outline'}`}>{badge.label}</span> : null}
        </div>
        {caption ? <p className="text-caption text-muted -mt-1">{caption}</p> : null}
      </div>
    </div>
  )

  return to ? <Link className="rounded-full" to={to}>{content}</Link> : content
}

function DrawerSidebar({ account, navAriaLabel, navGroups, onClose, user }) {
  const name = user?.name || 'PBX learner'
  return (
    <aside className="flex min-h-full w-65 flex-col bg-neutral px-5 py-8 text-neutral-content shadow-lg">
      <div className="relative mb-5 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-box bg-primary text-lg font-extrabold text-primary-content shadow-md">PBX</div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide">NCLEX-RN</p>
        <p className="text-xs text-neutral-content/60">Question Bank</p>
        <p className="mt-5 text-sm font-bold uppercase">{name}</p>
        <p className="text-xs text-neutral-content/60">Nursing learner</p>
        <button className="btn btn-ghost btn-square absolute right-3 lg:hidden" type="button" onClick={onClose} aria-label="Close app navigation">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="min-h-0 w-full flex-1 overflow-y-auto" aria-label={navAriaLabel}>
        {navGroups.map((group) => (
          <ul className="menu w-full gap-1 p-0" key={group.label}>
            {group.items.map((item) => (
              <li className="w-full" key={item.label}>
                <SidebarLink item={item} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        ))}
      </nav>

      {account}
    </aside>
  )
}

function DrawerHeader({ accountIdentity, onOpenSidebar, title }) {
  return (
    <header className={`surface-sticky ${title ? '' : 'lg:hidden'}`}>
      <div className="navbar min-h-20 px-4 md:px-10">
        <div className="navbar-start gap-2">
          <button className="btn btn-ghost btn-square lg:hidden" type="button" onClick={onOpenSidebar} aria-label="Open app navigation">
            <span className="material-symbols-outlined">menu</span>
          </button>
          {title ? <h1 className="truncate text-h3">{title}</h1> : null}
        </div>
        <div className="navbar-end">
          {accountIdentity}
        </div>
      </div>
    </header>
  )
}

function DrawerShell({ account, accountIdentity, brand, children, drawerId = 'app-drawer', navAriaLabel = 'App pages', navGroups, title, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="drawer lg:drawer-open surface-page min-h-screen" data-theme="nord">
      <input id={drawerId} type="checkbox" className="drawer-toggle" checked={sidebarOpen} onChange={(event) => setSidebarOpen(event.target.checked)} />

      <div className="drawer-content flex min-h-screen flex-col">
        <DrawerHeader accountIdentity={accountIdentity} onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        <main className="bg-base-200 flex-1">
          <section className="grid min-h-[calc(100vh-5rem)] w-full content-start gap-8 px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
            {children}
          </section>
        </main>
      </div>

      <div className="drawer-side z-50 lg:z-0">
        <label htmlFor={drawerId} aria-label="Close app navigation" className="drawer-overlay lg:hidden" />
        <DrawerSidebar
          account={account}
          brand={brand}
          navAriaLabel={navAriaLabel}
          navGroups={navGroups}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
      </div>
    </div>
  )
}

export default DrawerShell
