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

function Login() {
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button className="w-full" size="lg" type="submit">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default Login
