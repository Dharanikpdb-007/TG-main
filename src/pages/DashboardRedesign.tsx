import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import SOSButton from '../components/SOSButton'
import LocationTracker from '../components/LocationTracker'
import {
    Home, Map as MapIcon, Shield, User, Menu, Bell,
    CloudRain, FileText, Settings, LogOut, Phone, CreditCard, ChevronRight, ChevronLeft
} from 'lucide-react'
import './DashboardRedesign.css'

// Import components
import SafetyMap from '../components/SafetyMap'
import EmergencyContactsList from '../components/EmergencyContactsList'
import AddContactForm from '../components/AddContactForm'
import { EmergencyContact } from '../types'

export default function DashboardRedesign() {
    const { user, signOut } = useAuth()
    const [activeTab, setActiveTab] = useState<'home' | 'map' | 'sos' | 'tips' | 'profile'>('home')

    // Specific sub-views for Profile tab
    const [profileView, setProfileView] = useState<'main' | 'contacts'>('main')

    // Data State
    const [userProfile, setUserProfile] = useState<any>(null)
    const [contacts, setContacts] = useState<EmergencyContact[]>([])
    const [showAddContact, setShowAddContact] = useState(false)

    // Real-time weather mockup
    const [weather] = useState({ temp: 28, condition: 'Clear' })

    // Contacts count for badge
    const [contactCount, setContactCount] = useState(0)

    useEffect(() => {
        if (user?.id) {
            loadUserProfile()
            loadContacts()
        }
    }, [user?.id])

    const loadUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single()

            if (data) {
                setUserProfile(data)
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

    const loadContacts = async () => {
        try {
            const { data, count, error } = await supabase
                .from('emergency_contacts')
                .select('*', { count: 'exact' })
                .eq('user_id', user?.id)

            if (data) {
                setContacts(data)
                setContactCount(count || data.length)
            }
        } catch (error) {
            console.error('Error loading contacts:', error)
        }
    }

    const handleContactAdded = async () => {
        setShowAddContact(false)
        await loadContacts()
    }

    const handleContactDeleted = async () => {
        await loadContacts()
    }

    const handleSignOut = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error('Sign out error:', error)
        }
    }

    // --- Views ---

    const renderHome = () => (
        <div className="view-container">
            {/* 1. Status Card */}
            <div className="status-card safe">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="status-icon-wrapper">
                        <Shield size={24} />
                    </div>
                    <div>
                        <strong>You're Safe</strong>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Enable location for full protection</div>
                    </div>
                </div>
                <div className="risk-badge">Medium Risk</div>
            </div>

            {/* 2. ID Card */}
            <div className="id-card">
                <div className="id-info">
                    <User size={20} className="text-muted" />
                    <div>
                        <div style={{ fontWeight: 600 }}>{userProfile?.digital_id || user?.digital_id || 'TG-Generating...'}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Status: Active</div>
                    </div>
                </div>
                <button className="btn-view-id">View ID</button>
            </div>

            {/* 3. Central SOS Button (Floating Effect) */}
            <div className="central-sos-section">
                {/* We reuse the logic but style it to fit the new design */}
                <div style={{ transform: 'scale(1.2)' }}>
                    <SOSButton userId={user?.id} />
                </div>
            </div>

            {/* 4. Grid Menu */}
            <div className="actions-grid">
                <div className="action-card" onClick={() => setActiveTab('map')}>
                    <MapIcon size={32} color="#a78bfa" />
                    <span>View Map</span>
                </div>

                <div className="action-card">
                    <Bell size={32} color="#f472b6" />
                    <span>Alerts</span>
                    <div className="notification-badge">5</div>
                </div>

                <div className="action-card" onClick={() => setActiveTab('tips')}>
                    <Shield size={32} color="#34d399" />
                    <span>Safety Tips</span>
                </div>

                <div className="action-card">
                    <CloudRain size={32} color="#60a5fa" />
                    <span>Weather</span>
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>{weather.temp}°C</div>
                    <div className="weather-fab">
                        <CloudRain size={20} color="white" />
                    </div>
                </div>
            </div>

            {/* Background Tracker (hidden but active) */}
            <div style={{ display: 'none' }}>
                <LocationTracker userId={user?.id} />
            </div>
        </div>
    )

    const renderContactsSubView = () => (
        <div className="view-container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, padding: '0 16px', marginTop: 16 }}>
                <button onClick={() => setProfileView('main')} style={{ background: 'none', border: 'none', color: 'white', marginRight: 10 }}>
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Emergency Contacts</h2>
            </div>

            <div style={{ padding: '0 16px' }}>
                {contacts.length === 0 && !showAddContact && (
                    <div className="empty-state" style={{ textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                        <p>No emergency contacts added yet</p>
                        <button
                            onClick={() => setShowAddContact(true)}
                            className="btn-secondary"
                            style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, background: '#8b5cf6', color: 'white', border: 'none' }}
                        >
                            Add Your First Contact
                        </button>
                    </div>
                )}

                {showAddContact ? (
                    <AddContactForm
                        userId={user?.id}
                        onContactAdded={handleContactAdded}
                        onCancel={() => setShowAddContact(false)}
                    />
                ) : (
                    <>
                        {contacts.length > 0 && (
                            <>
                                <EmergencyContactsList
                                    contacts={contacts}
                                    onContactDeleted={handleContactDeleted}
                                />
                                <button
                                    onClick={() => setShowAddContact(true)}
                                    style={{ width: '100%', padding: 16, marginTop: 20, background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12 }}
                                >
                                    + Add Another Contact
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )

    const renderProfileMain = () => (
        <div className="view-container">
            <h2 className="profile-section-title">Personal Information</h2>

            <div className="profile-card-list">
                <div className="profile-info-row">
                    <User size={20} />
                    <span>{userProfile?.email || user?.email}</span>
                </div>
                <div className="profile-info-row">
                    <Phone size={20} />
                    <span>{userProfile?.phone || user?.phone || 'No phone added'}</span>
                </div>
                <div className="profile-info-row">
                    <MapIcon size={20} />
                    <span>Nationality: {userProfile?.nationality || 'India'}</span>
                </div>
                <div className="profile-info-row">
                    <MapIcon size={20} />
                    <span>10.9039, 76.9982</span>
                </div>
            </div>

            <h2 className="profile-section-title">Account</h2>

            <div className="menu-item" onClick={() => setProfileView('contacts')}>
                <User size={20} />
                <span style={{ flex: 1 }}>Emergency Contacts</span>
                <div style={{ background: '#8b5cf6', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{contactCount}</div>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </div>

            <div className="menu-item">
                <CreditCard size={20} />
                <span style={{ flex: 1 }}>Blockchain Activity Log</span>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </div>

            <div className="menu-item">
                <Settings size={20} />
                <span style={{ flex: 1 }}>Settings</span>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </div>

            <button onClick={handleSignOut} className="btn-signout-danger">
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
    )

    const renderProfile = () => {
        if (profileView === 'contacts') return renderContactsSubView()
        return renderProfileMain()
    }

    const renderMap = () => (
        <div className="view-container" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <SafetyMap />
        </div>
    )

    // --- Main Layout ---

    return (
        <div className="dashboard-container">
            {/* Header - Only show on main views, hide on sub-views if desired, keeping for consistency */}
            <header className="app-header">
                <Shield className="text-primary" size={24} color="#8b5cf6" />
                <h1>Tour Guard</h1>
            </header>

            {/* Main Content Area */}
            <main style={{ paddingBottom: '80px' }}>
                {activeTab === 'home' && renderHome()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'map' && renderMap()}
                {activeTab === 'sos' && (
                    <div style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
                        <h2>Emergency Mode Active</h2>
                        <SOSButton userId={user?.id} />
                        <p style={{ marginTop: 20, color: '#9ca3af' }}>Press and hold to send alert</p>
                        <button onClick={() => setActiveTab('home')} style={{ marginTop: 40, background: 'none', border: '1px solid #333', padding: '10px 20px', color: '#9ca3af', borderRadius: 8 }}>Cancel</button>
                    </div>
                )}
                {activeTab === 'tips' && (
                    <div style={{ padding: 20 }}>
                        <h2>Safety Tips</h2>
                        <p>Content coming soon...</p>
                        <button onClick={() => setActiveTab('home')} style={{ marginTop: 20, padding: 10 }}>Back</button>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button
                    className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('home'); setProfileView('main'); }}
                >
                    <Home size={24} />
                    <span>Home</span>
                </button>

                <button
                    className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
                    onClick={() => setActiveTab('map')}
                >
                    <MapIcon size={24} />
                    <span>Map</span>
                </button>

                <button
                    className={`nav-item ${activeTab === 'sos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sos')}
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
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>SOS</span>
                </button>

                <button
                    className={`nav-item ${activeTab === 'tips' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tips')}
                >
                    <FileText size={24} />
                    <span>Tips</span>
                </button>

                <button
                    className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <User size={24} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    )
}
