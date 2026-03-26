import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { postJson } from '@/lib/api'

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await postJson('/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      navigate('/login', {
        state: {
          message: 'Account created successfully. You can log in now.',
        },
      })
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
              React SoMe
            </span>
            <div className="space-y-1">
              <CardTitle className="text-2xl text-white">Create account</CardTitle>
              <CardDescription className="text-white/60">
                Set up your profile to start posting and connecting.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="border-white/10 bg-[#0c0c0e] text-white placeholder:text-white/30 focus:border-white/25"
                />
              </div>
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="border-white/10 bg-[#0c0c0e] text-white placeholder:text-white/30 focus:border-white/25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
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
              <Button className="w-full bg-white text-black hover:bg-white/90" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-white/60">
              Already have an account?{' '}
              <Link
                className="font-medium text-white underline underline-offset-4 transition hover:text-white/80"
                to="/login"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default Register
