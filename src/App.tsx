import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import './App.css'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LocationPermissionPage from './pages/LocationPermissionPage'
import HomePage from './pages/HomePage'
import ProfileManagerPage from './pages/ProfileManagerPage'
import ProfileView from './pages/ProfileView'
import MapPage from './pages/MapPage'
import IncidentReportPage from './pages/IncidentReportPage'
import SettingsPage from './pages/SettingsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import SOSTrackingPage from './pages/SOSTrackingPage'
import NearbyIncidentsPage from './pages/NearbyIncidentsPage'
import NearbyPlacesPage from './pages/NearbyPlacesPage'
import CommunityPage from './pages/CommunityPage'
import ChatbotPage from './pages/ChatbotPage'
import AlertsPage from './pages/AlertsPage'
import TipsPage from './pages/TipsPage'

// Components
import DashboardLayout from './components/DashboardLayout'
import SOSButton from './components/SOSButton'
import ScrollToTop from './components/ScrollToTop'

// Helper for SOS Page
const SOSPage = () => {
  const { user } = useAuth()
  return (
    <div style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
      <h2>Emergency Mode Active</h2>
      <SOSButton userId={user?.id} />
      <p style={{ marginTop: 20, color: '#9ca3af' }}>Press and hold to send alert</p>
    </div>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

  if (!isAuthenticated) return <Navigate to="/" />

  return <Outlet />
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth()
  const [isCheckingLocation, setIsCheckingLocation] = useState(true)
  const [locationVerified, setLocationVerified] = useState(false)

  // Location Permission Logic (Global check for authenticated users)
  useEffect(() => {
    if (isAuthenticated) {
      const checkPermission = async () => {
        const skipped = localStorage.getItem('location_skipped') === 'true'
        if (skipped) {
          setLocationVerified(true)
          setIsCheckingLocation(false)
          return
        }

        try {
          // Simple check if browser API works
          if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
              if (result.state === 'granted') setLocationVerified(true)
            })
          }
        } catch (e) { console.error(e) }

        // Timeout to stop checking
        setTimeout(() => setIsCheckingLocation(false), 1000)
      }
      checkPermission()
    } else {
      setIsCheckingLocation(false)
    }
  }, [isAuthenticated])

  const handlePermissionGranted = () => {
    setLocationVerified(true)
    localStorage.removeItem('location_skipped')
  }

  const handleSkipLocation = () => {
    setLocationVerified(true) // Allow proceeding
    localStorage.setItem('location_skipped', 'true')
  }

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!isAuthenticated ? <LandingPage onGetStarted={() => window.location.href = '/register'} onLogin={() => window.location.href = '/login'} /> : <Navigate to="/home" />} />

        <Route path="/login" element={!isAuthenticated ? <LoginPage onSwitchToRegister={() => window.location.href = '/register'} /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage onSwitchToLogin={() => window.location.href = '/login'} /> : <Navigate to="/home" />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={
            !locationVerified && !isCheckingLocation ? (
              <LocationPermissionPage onPermissionGranted={handlePermissionGranted} onSkip={handleSkipLocation} />
            ) : (
              <DashboardLayout />
            )
          }>
            <Route path="/home" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/profile-id" element={<ProfileManagerPage />} />
            <Route path="/incident-log" element={<IncidentReportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/tips" element={<TipsPage />} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/sos-tracking" element={<SOSTrackingPage />} />
            <Route path="/nearby-incidents" element={<NearbyIncidentsPage />} />
            <Route path="/places" element={<NearbyPlacesPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
