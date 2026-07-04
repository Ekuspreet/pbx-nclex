import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { getApiErrorMessage } from '../../services/apiClient.js'

function ResetPasswordPage() {
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus(null)

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords must match.' })
      return
    }

    setIsLoading(true)

    try {
      const result = await auth.resetPassword({ token, password })
      setStatus({ type: 'success', message: result.message })
      setPassword('')
      setConfirmPassword('')
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
          <h1 className="text-3xl font-black">Choose a new password</h1>
        </div>
        {status ? <div className={`alert text-sm ${status.type === 'error' ? 'alert-error' : 'alert-info'}`}><span>{status.message}</span></div> : null}
        <label className="grid gap-1">
          <span className="label-text">Reset token</span>
          <input className="input input-bordered w-full" value={token} onChange={(event) => setToken(event.target.value)} disabled={isLoading} />
        </label>
        <label className="grid gap-1">
          <span className="label-text">New password</span>
          <input className="input input-bordered w-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isLoading} />
        </label>
        <label className="grid gap-1">
          <span className="label-text">Confirm password</span>
          <input className="input input-bordered w-full" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isLoading} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={isLoading || !token || password.length < 8}>
          {isLoading ? <span className="loading loading-spinner loading-xs" /> : null}
          Reset password
        </button>
        <Link className="link link-primary text-center font-bold" to="/login">Return to login</Link>
      </form>
    </main>
  )
}

export default ResetPasswordPage
