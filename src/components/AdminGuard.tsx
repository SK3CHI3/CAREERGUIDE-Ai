import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminGuardProps {
  children: React.ReactNode
}

const ADMIN_PASSWORD_KEY = 'admin_dashboard_authenticated'

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_PASSWORD_KEY)
    setIsAuthenticated(stored === 'true')
    setLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    
    if (!adminPassword) {
      setError('Admin password not configured. Contact administrator.')
      return
    }

    if (password === adminPassword) {
      localStorage.setItem(ADMIN_PASSWORD_KEY, 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Lock className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card/50 backdrop-blur-md border-border shadow-glass">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Enter password to access the admin dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="bg-background/50"
                    autoFocus
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-red-500 text-center">{error}</div>
                )}
                
                <Button type="submit" className="w-full" size="lg">
                  Access Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
