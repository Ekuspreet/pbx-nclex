import { Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../ui/layout/AppShell.jsx'
import { business } from '../content/business.js'
import { getContent } from '../services/studyAdapter.js'
import { queryKeys } from '../services/queryKeys.js'

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

function PolicyPage({ contentKey, operatorNotice = false }) {
  const policyQuery = useQuery({ queryKey: queryKeys.content(contentKey), queryFn: ({ signal }) => getContent(contentKey, { signal }) })
  const businessQuery = useQuery({ queryKey: queryKeys.content('site.business'), queryFn: ({ signal }) => getContent('site.business', { signal }) })
  const currentBusiness = businessQuery.data?.content || business
  return (
    <AppShell>
      <main className="surface-muted py-12 md:py-16">
        <article className="container-page max-w-4xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm md:p-10">
          {operatorNotice ? <div className="alert alert-info mb-7"><span>This website is operated by <strong>{currentBusiness.tradeName}</strong>.</span></div> : null}
          {policyQuery.isPending ? <div className="grid min-h-48 place-items-center"><span className="loading loading-spinner loading-lg" /></div> : null}
          {policyQuery.isError ? <div className="alert alert-error"><span>{policyQuery.error.message}</span></div> : null}
          {policyQuery.data ? <MarkdownContent source={policyQuery.data.content.markdown} /> : null}
          <section className="mt-10 rounded-xl border border-base-300 bg-base-200 p-5">
            <h2 className="font-bold">Contact information</h2>
            <p className="mt-2"><strong>Support:</strong> {currentBusiness.supportEmail}</p>
          </section>
        </article>
      </main>
    </AppShell>
  )
}

export default PolicyPage
