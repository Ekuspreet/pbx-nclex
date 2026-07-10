import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import BrandLogo from '../landing/BrandLogo.jsx'

function SidebarLink({ item, onNavigate }) {
  return (
    <NavLink className={({ isActive }) => `font-bold ${isActive ? 'active font-black' : ''}`} end={item.end} onClick={onNavigate} to={item.href}>
      <span className="material-symbols-outlined">{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

export function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export function AccountPanel({ badge, caption, name, onLogout }) {
  return (
    <section className="border-t border-base-300 p-3">
      <div className="mb-3 flex min-w-0 items-center gap-3">
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
      <button className="btn btn-outline btn-sm w-full justify-start" type="button" onClick={onLogout}>
        <span className="material-symbols-outlined">logout</span>
        Log out
      </button>
    </section>
  )
}

function DrawerSidebar({ account, navAriaLabel, navGroups, onClose }) {
  return (
    <aside className="flex min-h-full w-72 flex-col bg-base-100 text-base-content lg:border-r lg:border-base-300">
      <div className="flex justify-end border-b border-base-300 p-3 lg:hidden">
        <button className="btn btn-ghost btn-square" type="button" onClick={onClose} aria-label="Close app navigation">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label={navAriaLabel}>
        {navGroups.map((group) => (
          <ul className="menu gap-1" key={group.label}>
            <li className="menu-title">{group.label}</li>
            {group.items.map((item) => (
              <li key={item.label}>
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

function DrawerHeader({ brand, onOpenSidebar }) {
  return (
    <header className="surface-sticky">
      <div className="navbar min-h-20 px-4 md:px-8">
        <div className="navbar-start gap-2">
          <button className="btn btn-ghost btn-square lg:hidden" type="button" onClick={onOpenSidebar} aria-label="Open app navigation">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <BrandLogo brand={brand} />
        </div>
      </div>
    </header>
  )
}

function DrawerShell({ account, brand, children, drawerId = 'app-drawer', navAriaLabel = 'App pages', navGroups, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="drawer lg:drawer-open surface-page min-h-screen" data-theme="nord">
      <input id={drawerId} type="checkbox" className="drawer-toggle" checked={sidebarOpen} onChange={(event) => setSidebarOpen(event.target.checked)} />

      <div className="drawer-content flex min-h-screen flex-col">
        <DrawerHeader brand={brand} onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="surface-muted flex-1">
          <section className="container-page grid min-h-[calc(100vh-5rem)] content-start gap-8 py-10 md:py-12">
            {title ? (
              <div className="grid gap-3">
                <h1 className="text-h2">{title}</h1>
              </div>
            ) : null}
            {children}
          </section>
        </main>
      </div>

      <div className="drawer-side z-50 lg:z-0">
        <label htmlFor={drawerId} aria-label="Close app navigation" className="drawer-overlay lg:hidden" />
        <DrawerSidebar
          account={account}
          navAriaLabel={navAriaLabel}
          navGroups={navGroups}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  )
}

export default DrawerShell
