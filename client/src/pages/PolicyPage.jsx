import { Fragment } from 'react'
import AppShell from '../ui/layout/AppShell.jsx'
import { business } from '../content/business.js'

function InlineText({ children }) {
  return String(children).split(/(\*\*.*?\*\*)/g).map((part, index) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>
  ))
}

function MarkdownContent({ source }) {
  const blocks = []
  const lines = String(source).split(/\r?\n/)
  let list = []

  const flushList = () => {
    if (!list.length) return
    blocks.push(<ul className="my-4 list-disc space-y-2 pl-6" key={`list-${blocks.length}`}>{list.map((item, index) => <li key={`${item}-${index}`}><InlineText>{item}</InlineText></li>)}</ul>)
    list = []
  }

  lines.forEach((line) => {
    const value = line.trim()
    if (value.startsWith('- ')) {
      list.push(value.slice(2))
      return
    }
    flushList()
    if (!value) return
    if (/^-{3,}$/.test(value)) {
      blocks.push(<hr className="my-7 border-base-300" key={`hr-${blocks.length}`} />)
    } else if (value.startsWith('# ')) {
      blocks.push(<h1 className="mb-8 text-4xl font-bold" key={`h1-${blocks.length}`}><InlineText>{value.slice(2)}</InlineText></h1>)
    } else if (value.startsWith('## ')) {
      blocks.push(<h2 className="mb-3 mt-8 text-2xl font-bold" key={`h2-${blocks.length}`}><InlineText>{value.slice(3)}</InlineText></h2>)
    } else if (value.startsWith('### ')) {
      blocks.push(<h3 className="mb-2 mt-6 text-lg font-bold" key={`h3-${blocks.length}`}><InlineText>{value.slice(4)}</InlineText></h3>)
    } else {
      blocks.push(<p className="my-3 leading-7 text-base-content/80" key={`p-${blocks.length}`}><InlineText>{value}</InlineText></p>)
    }
  })
  flushList()
  return blocks
}

function PolicyPage({ operatorNotice = false, source }) {
  return (
    <AppShell>
      <main className="surface-muted py-12 md:py-16">
        <article className="container-page max-w-4xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm md:p-10">
          {operatorNotice ? <div className="alert alert-info mb-7"><span>This website is operated by <strong>{business.tradeName}</strong>.</span></div> : null}
          <MarkdownContent source={source} />
          <section className="mt-10 rounded-xl border border-base-300 bg-base-200 p-5">
            <h2 className="font-bold">Business and contact information</h2>
            <p className="mt-2"><strong>Legal name:</strong> {business.legalName}</p>
            <p className="mt-2"><strong>Registered address:</strong> {business.registeredAddress}</p>
            <p className="mt-2"><strong>Support:</strong> {business.supportEmail}</p>
          </section>
        </article>
      </main>
    </AppShell>
  )
}

export default PolicyPage
