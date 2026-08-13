import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import BrandedLoader from './BrandedLoader'
import Index from '@/pages/Index'

const SmartRoot = () => {
  const { user, profile, loading } = useAuth()

  // Check if running as PWA (standalone mode)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches

  // Show loading while checking auth
  if (loading) {
    return <BrandedLoader fullScreen />
  }

  // Only redirect if it's a PWA install
  if (isPWA) {
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

  // Regular web - show homepage
  return <Index />
}

export default SmartRoot
