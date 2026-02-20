import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { EmergencyContact } from '../types'
import SOSButton from '../components/SOSButton'
import EmergencyContactsList from '../components/EmergencyContactsList'
import AddContactForm from '../components/AddContactForm'
import LocationTracker from '../components/LocationTracker'
import ProfilePage from './ProfilePage'
import IncidentReportPage from './IncidentReportPage'
import TrustedZonesPage from './TrustedZonesPage'
import { LogOut, Shield, User, AlertTriangle, MapPin, Activity } from 'lucide-react'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showIncidents, setShowIncidents] = useState(false)
  const [showZones, setShowZones] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadContacts()
    }
  }, [user?.id])

  const loadContacts = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setIsLoadingContacts(false)
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
      console.error('Signout error:', error)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <Shield size={32} />
            <h1>Tour Guard</h1>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowProfile(true)}
              className="action-button"
              title="Profile"
            >
              <User size={20} />
            </button>
            <button
              onClick={() => setShowIncidents(true)}
              className="action-button"
              title="Incidents"
            >
              <AlertTriangle size={20} />
            </button>
            <button
              onClick={() => setShowZones(true)}
              className="action-button"
              title="Trusted Zones"
            >
              <MapPin size={20} />
            </button>
            <button onClick={handleSignOut} className="logout-button">
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          <div className="sos-section">
            <div className="section-header">
              <h2>Emergency SOS</h2>
              <p>One-touch emergency alert system</p>
            </div>

            <LocationTracker userId={user?.id} />

            <SOSButton userId={user?.id} />

            <div className="sos-info">
              <h4>How SOS Works</h4>
              <ul>
                <li>Press the SOS button to trigger an emergency alert</li>
                <li>Your current location will be sent to emergency contacts</li>
                <li>All emergency contacts will receive detailed email notifications</li>
                <li>Include emergency type and description for better response</li>
              </ul>
            </div>
          </div>

          <div className="contacts-section">
            <div className="section-header">
              <h2>Emergency Contacts</h2>
              <p>Notify these people during SOS</p>
            </div>

            {contacts.length === 0 && !showAddContact && (
              <div className="empty-state">
                <p>No emergency contacts added yet</p>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="btn-secondary"
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
                      className="btn-secondary"
                    >
                      Add Another Contact
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="user-info-section">
          <h3>Quick Info</h3>
          <div className="profile-info">
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">{user?.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Digital ID:</span>
              <span className="value">{user?.digital_id}</span>
            </div>
            {user?.phone && (
              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
      {showIncidents && (
        <IncidentReportPage onClose={() => setShowIncidents(false)} />
      )}
      {showZones && <TrustedZonesPage onClose={() => setShowZones(false)} />}
    </div>
  )
}
