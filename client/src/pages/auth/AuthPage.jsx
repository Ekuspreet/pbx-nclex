import { GoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import authImage from '../../assets/auth.jpg'
import { brand, navigation } from '../../content/landing/index.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import LandingHeader from '../../ui/landing/LandingHeader.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function AuthPage({ mode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isSignup = mode === 'signup'
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}
    if (isSignup && values.name.trim().length < 2) nextErrors.name = 'Enter your name.'
    if (!emailPattern.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    if (values.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      nextErrors.password = 'Use at least 8 characters with a letter and number.'
    }
    if (isSignup && values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords must match.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus(null)
    if (!validate()) return
    setIsLoading(true)

    try {
      if (isSignup) {
        const result = await auth.signup({
          name: values.name,
          email: values.email,
          password: values.password,
        })

        navigate(`/verify-email?email=${encodeURIComponent(values.email.trim())}`, {
          state: {
            email: values.email.trim(),
            message: result.message,
            resendCooldownSeconds: result.emailVerification?.resendCooldownSeconds,
          },
        })
      } else {
        await auth.login({
          email: values.email,
          password: values.password,
        })

        navigate(location.state?.from?.pathname || '/home', { replace: true })
      }
    } catch (error) {
      setStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (response) => {
    if (!response.credential) {
      setStatus({ type: 'error', message: 'Google did not return a credential.' })
      return
    }

    setStatus(null)
    setIsLoading(true)

    try {
      await auth.loginWithGoogle(response.credential)
      navigate('/home', { replace: true })
    } catch (error) {
      setStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="surface-page min-h-screen overflow-x-hidden" data-theme="nord">
      <LandingHeader brand={brand} navigation={navigation} />

      <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-base-100 lg:grid lg:grid-cols-[2fr_1fr]">
        <img className="absolute inset-0 h-full w-full object-cover lg:hidden" src={authImage} alt="" aria-hidden="true" />
        <div className="absolute inset-0 bg-neutral/55 backdrop-blur-[1px] lg:hidden" aria-hidden="true" />

        <section className="relative hidden min-h-[calc(100vh-10rem)] overflow-hidden lg:block">
          <img className="absolute inset-0 h-full w-full object-cover" src={authImage} alt="Nursing student preparing for nursing practice" />
          <div className="absolute inset-0 bg-gray-500/55 backdrop-blur-[1px]" aria-hidden="true" />
        </section>

        <section className="relative grid min-h-[calc(100vh-5rem)] place-items-center bg-transparent px-4 py-10 lg:bg-base-100">
          <form
            className="relative z-10 w-full max-w-md rounded-box border border-base-300 bg-base-100/95 shadow-xl backdrop-blur-md lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="grid gap-2 text-center">
                <p className="text-kicker">{isSignup ? 'Start learning' : 'Welcome back'}</p>
                <h1 className="text-3xl font-black">{isSignup ? 'Create your account' : 'Log in to PBX Nursing'}</h1>
              </div>

              {status ? (
                <div className={`alert text-sm ${status.type === 'error' ? 'alert-error' : 'alert-info'}`}>
                  <span>{status.message}</span>
                </div>
              ) : null}

              {googleClientId ? (
                <div className="grid place-items-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setStatus({ type: 'error', message: 'Google Sign-In was not completed.' })}
                    text={isSignup ? 'signup_with' : 'signin_with'}
                    width="320"
                  />
                </div>
              ) : (
                <button className="btn btn-outline w-full" type="button" disabled>
                  Google Sign-In unavailable
                </button>
              )}

              <div className="divider my-0">or</div>

              {isSignup ? (
                <label className="grid gap-1">
                  <span className="label-text">Name</span>
                  <input className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} name="name" value={values.name} onChange={updateValue} disabled={isLoading} />
                  {errors.name ? <span className="mt-1 text-xs text-error">{errors.name}</span> : null}
                </label>
              ) : null}

              <label className="grid gap-1">
                <span className="label-text">Email</span>
                <input className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} name="email" type="email" value={values.email} onChange={updateValue} disabled={isLoading} />
                {errors.email ? <span className="mt-1 text-xs text-error">{errors.email}</span> : null}
              </label>

              <label className="grid gap-1">
                <span className="label-text">Password</span>
                <input className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`} name="password" type="password" value={values.password} onChange={updateValue} disabled={isLoading} />
                {errors.password ? <span className="mt-1 text-xs text-error">{errors.password}</span> : null}
              </label>

              {isSignup ? (
                <label className="grid gap-1">
                  <span className="label-text">Confirm password</span>
                  <input className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`} name="confirmPassword" type="password" value={values.confirmPassword} onChange={updateValue} disabled={isLoading} />
                  {errors.confirmPassword ? <span className="mt-1 text-xs text-error">{errors.confirmPassword}</span> : null}
                </label>
              ) : (
                <Link className="link link-primary text-sm font-bold" to="/forgot-password">
                  Forgot password?
                </Link>
              )}

              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner loading-xs" /> : null}
                {isSignup ? 'Sign up' : 'Log in'}
              </button>
              <p className="text-center text-sm text-base-content/70">
                {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
                <Link className="link link-primary font-bold" to={isSignup ? '/login' : '/signup'}>
                  {isSignup ? 'Log in' : 'Sign up'}
                </Link>
              </p>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default AuthPage
