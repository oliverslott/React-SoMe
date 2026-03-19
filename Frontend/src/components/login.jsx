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
      } catch (error) {
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
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-sm items-center justify-center">
        <Card className="w-full border border-border/70 bg-card/95 shadow-xl shadow-slate-950/5 backdrop-blur">
          <CardHeader className="space-y-3 text-left">
            <span className="w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium tracking-[0.24em] uppercase text-muted-foreground">
              React SoMe
            </span>
            <div className="space-y-1">
              <CardTitle className="text-2xl">Log in</CardTitle>
              <CardDescription>
                Enter your email and password to continue.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                />
              </div>
              {errorMessage ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}
              {loggedInUser ? (
                <p className="text-sm text-muted-foreground">
                  Account email: {loggedInUser.email}
                </p>
              ) : null}
              {isCheckingSession ? (
                <p className="text-sm text-muted-foreground">Checking session...</p>
              ) : null}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Continue'}
              </Button>
              {loggedInUser ? (
                <Button
                  className="w-full"
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
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Need an account?{' '}
              <Link
                className="font-medium text-foreground underline underline-offset-4 transition hover:text-primary"
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
