import { Link } from 'react-router-dom'
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

function Register() {
  function handleSubmit(event) {
    event.preventDefault()
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
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription>
                Set up your profile to start posting and connecting.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button className="w-full" size="lg" type="submit">
                Create account
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                className="font-medium text-foreground underline underline-offset-4 transition hover:text-primary"
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
