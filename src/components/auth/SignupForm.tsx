import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, GraduationCap, User, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  upiOrPhone: z.string().min(4, 'Please enter your UPI number or phone number'),
  role: z.enum(['student', 'teacher']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'teacher' && !data.email) return false;
  return true;
}, {
  message: "Email is required for teachers",
  path: ["email"],
})

type SignupFormData = z.infer<typeof signupSchema>

interface SignupFormProps {
  onToggleMode: () => void
  defaultRole?: 'student' | 'teacher'
}

export const SignupForm: React.FC<SignupFormProps> = ({ onToggleMode, defaultRole = 'student' }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signUp } = useAuth()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: defaultRole
    }
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let finalEmail = data.email;
      const isStudent = data.role === 'student';

      if (isStudent && !finalEmail) {
        const cleanUPI = data.upiOrPhone.trim().toUpperCase();
        finalEmail = `${cleanUPI.toLowerCase()}@student.careerguideai.co.ke`;
      }

      const { error } = await signUp(finalEmail || '', data.password, data.fullName, data.upiOrPhone, data.role)

      if (error) {
        setError(error.message)
      } else {
        if (isStudent && !data.email) {
          setSuccess('Account created successfully! You can now sign in using your UPI and password.')
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join CareerGuide AI to discover your future
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 border-green-500/50 text-green-500">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label>Register as</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setValue('role', 'student')}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex flex-col items-center gap-2 group ${selectedRole === 'student'
                  ? 'border-primary bg-primary/5'
                  : 'border-card-border hover:border-primary/40 text-muted-foreground'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedRole === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                  }`}>
                  <User size={20} />
                </div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${selectedRole === 'student' ? 'text-primary' : 'text-foreground'}`}>Student</p>
                  <p className="text-[10px] opacity-70">Seek career guidance</p>
                </div>
                {selectedRole === 'student' && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary text-primary-foreground rounded-full w-4 h-4">
                    <Check size={10} />
                  </div>
                )}
              </div>

              <div
                onClick={() => setValue('role', 'teacher')}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex flex-col items-center gap-2 group relative ${selectedRole === 'teacher'
                  ? 'border-primary bg-primary/5'
                  : 'border-card-border hover:border-primary/40 text-muted-foreground'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedRole === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                  }`}>
                  <GraduationCap size={20} />
                </div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${selectedRole === 'teacher' ? 'text-primary' : 'text-foreground'}`}>Teacher</p>
                  <p className="text-[10px] opacity-70">Guide students' careers</p>
                </div>
                {selectedRole === 'teacher' && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary text-primary-foreground rounded-full w-4 h-4">
                    <Check size={10} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{selectedRole === 'teacher' ? 'Full Name' : 'Full Name'}</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              {...register('fullName')}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {selectedRole === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {selectedRole === 'student' ? (
              <>
                <Label htmlFor="upiOrPhone">NEMIS UPI Number</Label>
                <Input
                  id="upiOrPhone"
                  type="text"
                  placeholder="e.g. A1B2C3 (from your NEMIS record)"
                  {...register('upiOrPhone')}
                  disabled={isLoading}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">Your 4–12 character Unique Personal Identifier from Kenya's NEMIS system.</p>
              </>
            ) : (
              <>
                <Label htmlFor="upiOrPhone">Phone Number</Label>
                <Input
                  id="upiOrPhone"
                  type="tel"
                  placeholder="e.g. 0712345678"
                  {...register('upiOrPhone')}
                  disabled={isLoading}
                />
              </>
            )}
            {errors.upiOrPhone && (
              <p className="text-sm text-destructive">{errors.upiOrPhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={onToggleMode}
              >
                Sign in
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
