import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getJson, postJson } from '@/lib/api'

const INITIAL_FORM_DATA = {
  email: '',
  password: '',
}

function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(location.state?.message ?? '')
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  useEffect(() => {
    let isCancelled = false

    async function loadCurrentUser() {
      try {
        const response = await getJson('/me')

        if (isCancelled) {
          return
        }

        setLoggedInUser(response.user)
      } catch {
        if (isCancelled) {
          return
        }

        setLoggedInUser(null)
      } finally {
        if (!isCancelled) {
          setIsCheckingSession(false)
        }
      }
    }

    loadCurrentUser()

    return () => {
      isCancelled = true
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const response = await postJson('/login', formData)
      setLoggedInUser(response.user)
      navigate('/', { replace: true })
    } catch (error) {
      setLoggedInUser(null)
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await postJson('/logout')
      setLoggedInUser(null)
      setSuccessMessage('You have been logged out.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#0f0f10_35%,_#060606_100%)]
        px-4
        py-10
        text-white
      "
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-sm items-center justify-center">
        <Card className="w-full border border-white/10 bg-[#101012]/90 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <CardHeader className="space-y-3 text-left">
            <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium tracking-[0.24em] uppercase text-white/60">
              SoMe
            </span>
            <div className="space-y-1">
              <CardTitle className="text-2xl text-white">Log in</CardTitle>
              <CardDescription className="text-white/60">
                Enter your email and password to continue.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="border-white/10 bg-[#0c0c0e] text-white placeholder:text-white/30 focus:border-white/25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="border-white/10 bg-[#0c0c0e] text-white placeholder:text-white/30 focus:border-white/25"
                />
              </div>
              {errorMessage ? (
                <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                  {successMessage}
                </p>
              ) : null}
              {loggedInUser ? (
                <p className="text-sm text-white/60">
                  Account email: {loggedInUser.email}
                </p>
              ) : null}
              {isCheckingSession ? (
                <p className="text-sm text-white/60">Checking session...</p>
              ) : null}
              <Button className="w-full bg-white text-black hover:bg-white/90" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Continue'}
              </Button>
              {loggedInUser ? (
                <Button
                  className="w-full border-white/10 bg-transparent text-white hover:bg-white/10"
                  size="lg"
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isSubmitting}
                >
                  Log out
                </Button>
              ) : null}
            </form>
            <p className="mt-4 text-center text-sm text-white/60">
              Need an account?{' '}
              <Link
                className="font-medium text-white underline underline-offset-4 transition hover:text-white/80"
                to="/register"
              >
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default Login
