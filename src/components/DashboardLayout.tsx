import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Shield, Home, Map as MapIcon, FileText, User, Bell, Settings } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import '../pages/DashboardRedesign.css' // Reuse existing styles
import LocationTracker from './LocationTracker'

export default function DashboardLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useLanguage()

    // Helper to determine active state. Matches if path starts with or is exactly.
    // We use strict match or startswith for sub-routes if any.
    const isActive = (path: string) => {
        if (path === '/home' && location.pathname === '/') return true // special case if index redirects to home or is home
        return location.pathname.startsWith(path)
    }

    return (
        <div className="dashboard-container">
            <LocationTracker />
            {/* Header */}
            <header className="app-header">
                <Shield size={22} color="#00e676" />
                <h1 style={{ flex: 1, letterSpacing: '1px', fontWeight: 800, fontSize: '1.3rem' }}>Tour Guard</h1>
                <button onClick={() => navigate('/alerts')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
                    <Bell size={22} />
                </button>
                <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
                    <Settings size={22} />
                </button>
            </header>

            {/* Main content from Router */}
            <main style={{ paddingBottom: '80px', minHeight: 'calc(100vh - 140px)' }}>
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button
                    className={`nav-item ${isActive('/home') ? 'active' : ''}`}
                    onClick={() => navigate('/home')}
                >
                    <Home size={24} />
                    <span>{t('home')}</span>
                </button>

                <button
                    className={`nav-item ${isActive('/map') ? 'active' : ''}`}
                    onClick={() => navigate('/map')}
                >
                    <MapIcon size={24} />
                    <span>{t('map')}</span>
                </button>

                <button
                    className={`nav-item ${isActive('/sos') ? 'active' : ''}`}
                    onClick={() => navigate('/sos')}
                >
                    <div style={{
                        background: '#ef4444',
                        padding: 12,
                        borderRadius: '50%',
                        marginTop: -24,
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                    }}>
                        <Shield size={24} color="white" />
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{t('sos')}</span>
                </button>

                <button
                    className={`nav-item ${isActive('/tips') ? 'active' : ''}`}
                    onClick={() => navigate('/tips')}
                >
                    <FileText size={24} />
                    <span>{t('tips')}</span>
                </button>

                <button
                    className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                    onClick={() => navigate('/profile')}
                >
                    <User size={24} />
                    <span>{t('profile')}</span>
                </button>
            </nav>

            {/* Floating SOS Button – hidden on SOS page */}
            {!isActive('/sos') && (
                <button
                    className="sos-fab-mini"
                    onClick={() => navigate('/sos')}
                    title="Emergency SOS"
                    style={{
                        position: 'fixed',
                        bottom: 110,
                        right: 18,
                        zIndex: 50,
                        width: 54,
                        height: 54,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.5)',
                    }}
                >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>🚨</span>
                </button>
            )}
        </div>
    )
}
