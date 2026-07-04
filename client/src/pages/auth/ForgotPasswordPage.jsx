import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { getApiErrorMessage } from '../../services/apiClient.js'

function ForgotPasswordPage() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus(null)
    setIsLoading(true)

    try {
      const result = await auth.forgotPassword({ email })
      setStatus({ type: 'info', message: result.message })
    } catch (error) {
      setStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="surface-page grid min-h-screen place-items-center px-4 py-10" data-theme="nord">
      <form className="grid w-full max-w-md gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2 text-center">
          <p className="text-kicker">Password reset</p>
          <h1 className="text-3xl font-black">Reset your password</h1>
        </div>
        {status ? <div className={`alert text-sm ${status.type === 'error' ? 'alert-error' : 'alert-info'}`}><span>{status.message}</span></div> : null}
        <label className="grid gap-1">
          <span className="label-text">Email</span>
          <input className="input input-bordered w-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={isLoading || !email}>
          {isLoading ? <span className="loading loading-spinner loading-xs" /> : null}
          Send reset link
        </button>
        <Link className="link link-primary text-center font-bold" to="/login">Return to login</Link>
      </form>
    </main>
  )
}

export default ForgotPasswordPage
