import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppSettings } from '../types'
import { Save, X, CreditCard, Calendar } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import './ProfilePage.css'

export default function ProfilePage({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profile_picture: '',
  })
  // Extra details state
  const [extraDetails, setExtraDetails] = useState({
    passport_number: '',
    entry_date: '',
    exit_date: '',
    digital_id: ''
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) return
    try {
      // Load Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (settingsError) throw settingsError
      setSettings(settingsData)

      // Load Extended Profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        profile_picture: userData.profile_picture || '',
      })

      setExtraDetails({
        passport_number: userData.passport_number || 'N/A',
        entry_date: userData.entry_date || 'N/A',
        exit_date: userData.exit_date || 'N/A',
        digital_id: userData.digital_id || userData.id || 'Unknown'
      })

    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const getQRData = () => {
    return `TOUR GUARD DIGITAL ID\n\nName: ${formData.name}\nPassport: ${extraDetails.passport_number}\nEntry: ${extraDetails.entry_date}\nExit: ${extraDetails.exit_date}\nRef: ${extraDetails.digital_id}`;
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          profile_picture: formData.profile_picture,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Profile updated successfully')
      setIsEditing(false)
      loadProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSetting = async (setting: keyof AppSettings, value: boolean) => {
    if (!settings?.id) return

    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ [setting]: value, updated_at: new Date().toISOString() })
        .eq('id', settings.id)

      if (updateError) throw updateError

      setSettings({ ...settings, [setting]: value })
    } catch (err) {
      console.error('Error updating setting:', err)
    }
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>My Profile & Settings</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <div className="profile-modal-content">
          {/* Profile Section */}
          <section className="profile-section">
            <h3>Personal Information</h3>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Digital ID Card */}
            <div style={{
              background: '#1f2937',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              border: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: '50%',
                  background: '#374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {formData.profile_picture ? (
                    <img src={formData.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem', color: '#9ca3af' }}>{formData.name.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
                    {extraDetails.digital_id.substring(0, 12)}
                  </div>
                  <div style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Status: Location Active
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowQR(!showQR)}
                style={{
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {showQR ? 'Hide ID' : 'View ID'}
              </button>
            </div>

            {/* QR Expandable */}
            {showQR && (
              <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 16,
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <QRCodeCanvas value={getQRData()} size={180} />
                <p style={{ marginTop: 16, color: '#333', fontWeight: 700 }}>{extraDetails.digital_id}</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Official Tourist Digital ID</p>
              </div>
            )}

            {!isEditing ? (
              <div className="profile-view">
                <div className="profile-item">
                  <label>Name</label>
                  <p>{formData.name}</p>
                </div>

                <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="profile-item">
                    <label>Passport Number</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={16} /> {extraDetails.passport_number}
                    </p>
                  </div>
                </div>

                <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="profile-item">
                    <label>Entry Date</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={16} /> {extraDetails.entry_date}
                    </p>
                  </div>
                  <div className="profile-item">
                    <label>Exit Date</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={16} /> {extraDetails.exit_date}
                    </p>
                  </div>
                </div>

                <div className="profile-item">
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>
                <div className="profile-item">
                  <label>Phone</label>
                  <p>{formData.phone || 'Not added'}</p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                  style={{ marginTop: 16 }}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group">
                  <label>Profile Picture URL</label>
                  <input
                    type="url"
                    value={formData.profile_picture}
                    onChange={(e) =>
                      setFormData({ ...formData, profile_picture: e.target.value })
                    }
                    placeholder="https://example.com/photo.jpg"
                    disabled={isSaving}
                  />
                </div>

                <div className="form-actions">
                  <button
                    onClick={handleSaveProfile}
                    className="btn-primary"
                    disabled={isSaving}
                  >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadProfile()
                    }}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Settings Section */}
          {settings && (
            <section className="settings-section">
              <h3>Emergency Settings</h3>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Auto Emergency Alert</label>
                  <p>Automatically alert contacts when SOS is triggered</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emergency_auto_alert}
                    onChange={(e) =>
                      handleToggleSetting('emergency_auto_alert', e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Location Tracking</label>
                  <p>Share your location with the app</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.location_tracking_enabled}
                    onChange={(e) =>
                      handleToggleSetting('location_tracking_enabled', e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Share Location with Contacts</label>
                  <p>Allow emergency contacts to view your location</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.share_location_with_contacts}
                    onChange={(e) =>
                      handleToggleSetting('share_location_with_contacts', e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>SOS Sound Alert</label>
                  <p>Play alert sound when SOS is triggered</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.sos_sound_enabled}
                    onChange={(e) =>
                      handleToggleSetting('sos_sound_enabled', e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>SOS Vibration Alert</label>
                  <p>Vibrate device when SOS is triggered</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.sos_vibration_enabled}
                    onChange={(e) =>
                      handleToggleSetting('sos_vibration_enabled', e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="form-group">
                <label>Emergency Mode Timeout (minutes)</label>
                <select
                  value={settings.emergency_mode_timeout_minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    handleToggleSetting(
                      'emergency_mode_timeout_minutes',
                      value as unknown as boolean
                    )
                  }}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
