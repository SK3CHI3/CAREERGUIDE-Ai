import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import BrandedLoader from './BrandedLoader'

const SmartRoot = () => {
  const { user, profile, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return <BrandedLoader fullScreen />
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Logged in - redirect based on role
  const role = profile?.role || 'student'

  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'mentor':
      return <Navigate to="/mentor" replace />
    case 'student':
    default:
      return <Navigate to="/student" replace />
  }
}

export default SmartRoot
