import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { getApiErrorMessage } from '../../services/apiClient.js'

function VerifyEmailPage() {
  const auth = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(location.state?.email || searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(location.state?.resendCooldownSeconds || 0)
  const [status, setStatus] = useState(location.state?.message ? { type: 'info', message: location.state.message } : null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const handleVerify = async (event) => {
    event.preventDefault()
    setStatus(null)
    setIsLoading(true)

    try {
      const result = await auth.verifyEmail({ email, otp })
      setIsVerified(true)
      setStatus({ type: 'success', message: result.message })
    } catch (error) {
      setStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setStatus(null)
    setIsLoading(true)

    try {
      const result = await auth.resendOtp({ email })
      setCooldown(result.emailVerification?.resendCooldownSeconds || 60)
      setStatus({ type: 'info', message: result.message })
    } catch (error) {
      setStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="surface-page grid min-h-screen place-items-center px-4 py-10" data-theme="nord">
      <form className="grid w-full max-w-md gap-4" onSubmit={handleVerify}>
        <div className="grid gap-2 text-center">
          <p className="text-kicker">Email verification</p>
          <h1 className="text-3xl font-black">Enter your code</h1>
        </div>
        {status ? <div className={`alert text-sm ${status.type === 'error' ? 'alert-error' : 'alert-info'}`}><span>{status.message}</span></div> : null}
        <label className="grid gap-1">
          <span className="label-text">Email</span>
          <input className="input input-bordered w-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading || isVerified} />
        </label>
        <label className="grid gap-1">
          <span className="label-text">Verification code</span>
          <input className="input input-bordered w-full text-center text-lg tracking-[0.35em]" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={isLoading || isVerified} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={isLoading || isVerified || otp.length !== 6}>
          {isLoading ? <span className="loading loading-spinner loading-xs" /> : null}
          Verify email
        </button>
        <button className="btn btn-outline" type="button" onClick={handleResend} disabled={isLoading || isVerified || cooldown > 0 || !email}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        <Link className="link link-primary text-center font-bold" to="/login">Return to login</Link>
      </form>
    </main>
  )
}

export default VerifyEmailPage
