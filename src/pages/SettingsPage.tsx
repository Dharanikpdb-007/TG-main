import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { ChevronLeft, Download, Trash2, Settings as SettingsIcon, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './SettingsPage.css'

export default function SettingsPage() {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const { language, setLanguage, t } = useLanguage()
    const { isDark, setTheme } = useTheme()
    const { showNotification } = useNotification()

    // Notification states
    const [notifEnabled, setNotifEnabled] = useState(true)
    const [notifTypes, setNotifTypes] = useState({
        incident: true,
        zone: true,
        emergency: true,
        sos: true,
    })

    // Location states
    const [locationEnabled, setLocationEnabled] = useState(true)
    const [locationAccuracy, setLocationAccuracy] = useState<'gps_network' | 'gps' | 'network'>('gps_network')

    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const handleLocationToggle = () => {
        if (!locationEnabled) {
            // Request location permission
            navigator.geolocation.getCurrentPosition(
                () => setLocationEnabled(true),
                () => showNotification('Location permission denied. Please enable in browser settings.', 'warning'),
                { enableHighAccuracy: true }
            )
        } else {
            setLocationEnabled(false)
        }
    }

    const handleExportData = async () => {
        setIsExporting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                showNotification('No user logged in', 'error')
                setIsExporting(false)
                return
            }

            // Fetch all related data
            const [profile, touristRecord, contacts, incidents, locationHistory, alerts, logs] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('tourist_records').select('*').eq('user_id', user.id).single(),
                supabase.from('emergency_contacts').select('*').eq('user_id', user.id),
                supabase.from('incident_reports').select('*').eq('user_id', user.id),
                supabase.from('location_history').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(100), // Limit to last 100 for now
                supabase.from('alerts').select('*').eq('user_id', user.id),
                supabase.from('blockchain_event_logs').select('*').eq('user_id', user.id)
            ])

            const exportData = {
                exportedAt: new Date().toISOString(),
                user: {
                    id: user.id,
                    email: user.email
                },
                profile: profile.data,
                touristRecord: touristRecord.data,
                emergencyContacts: contacts.data,
                incidents: incidents.data,
                locationHistory: locationHistory.data,
                alerts: alerts.data,
                blockchainLogs: logs.data
            }

            // Create download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tourguard-data-${new Date().toISOString().split('T')[0]}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            showNotification('Your data export has been downloaded successfully.', 'success')
        } catch (error) {
            console.error('Export failed:', error)
            showNotification('Failed to export data. Please try again.', 'error')
        } finally {
            setIsExporting(false)
        }
    }

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm('Are you absolutely sure? This action cannot be undone.')
        if (confirmed) {
            try {
                await signOut()
                navigate('/')
            } catch (error) {
                console.error(error)
            }
        }
    }

    const toggleNotifType = (key: keyof typeof notifTypes) => {
        setNotifTypes(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Custom toggle component
    const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
        <div className="s-toggle" data-on={on} onClick={onToggle}>
            <div className="s-toggle-knob" />
        </div>
    )

    // Custom checkbox
    const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
        <label className="s-checkbox-row" onClick={onChange}>
            <div className={`s-checkbox ${checked ? 'checked' : ''}`}>
                {checked && <span>✓</span>}
            </div>
            <span>{label}</span>
        </label>
    )

    // Radio item
    const RadioItem = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
        <label className="s-radio-row" onClick={onClick}>
            <div className={`s-radio ${selected ? 'selected' : ''}`}>
                <div className="s-radio-dot" />
            </div>
            <span>{label}</span>
        </label>
    )

    return (
        <div className="settings-page">
            {/* Header */}
            <div className="s-header">
                <button onClick={() => navigate(-1)} className="s-back-btn">
                    <ChevronLeft size={24} />
                </button>
                <SettingsIcon size={22} color="#00e676" />
                <h2>{t('settings')}</h2>
            </div>

            {/* Language Preferences */}
            <section className="s-section">
                <h3 className="s-section-title">{t('languagePreferences')}</h3>
                <div className="s-card">
                    <label className="s-label">{t('selectLanguage')}</label>
                    <select
                        className="s-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                    >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="fr">Français (French)</option>
                    </select>
                </div>
            </section>

            {/* Notifications */}
            <section className="s-section">
                <h3 className="s-section-title">{t('notifications')}</h3>
                <div className="s-card">
                    <div className="s-row-between">
                        <div>
                            <span className="s-row-label">{t('enableNotifications')}</span>
                            <span className="s-row-desc">{t('enableNotificationsDesc')}</span>
                        </div>
                        <Toggle on={notifEnabled} onToggle={() => setNotifEnabled(!notifEnabled)} />
                    </div>

                    {notifEnabled && (
                        <div className="s-sub-section">
                            <span className="s-sub-label">{t('notificationTypes')}</span>
                            <Checkbox checked={notifTypes.incident} onChange={() => toggleNotifType('incident')} label={t('incidentNotifications')} />
                            <Checkbox checked={notifTypes.zone} onChange={() => toggleNotifType('zone')} label={t('zoneAlerts')} />
                            <Checkbox checked={notifTypes.emergency} onChange={() => toggleNotifType('emergency')} label={t('emergencyNotifications')} />
                            <Checkbox checked={notifTypes.sos} onChange={() => toggleNotifType('sos')} label={t('sosAlerts')} />
                        </div>
                    )}
                </div>
            </section>

            {/* Location & Privacy */}
            <section className="s-section">
                <h3 className="s-section-title">{t('locationPrivacy')}</h3>
                <div className="s-card">
                    <div className="s-row-between">
                        <div>
                            <span className="s-row-label">{t('locationServices')}</span>
                            <span className="s-row-desc">{t('locationServicesDesc')}</span>
                        </div>
                        <Toggle on={locationEnabled} onToggle={handleLocationToggle} />
                    </div>

                    {locationEnabled && (
                        <div className="s-sub-section">
                            <span className="s-sub-label">{t('locationAccuracy')}</span>
                            <RadioItem
                                selected={locationAccuracy === 'gps_network'}
                                label={`High (${t('locationNetwork')})`}
                                onClick={() => setLocationAccuracy('gps_network')}
                            />
                            <RadioItem
                                selected={locationAccuracy === 'gps'}
                                label={t('locationOnly')}
                                onClick={() => setLocationAccuracy('gps')}
                            />
                            <RadioItem
                                selected={locationAccuracy === 'network'}
                                label={t('networkOnly')}
                                onClick={() => setLocationAccuracy('network')}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Appearance */}
            <section className="s-section">
                <h3 className="s-section-title">{t('appearance')}</h3>
                <div className="s-card">
                    <div className="s-row-between">
                        <div>
                            <span className="s-row-label">{t('darkTheme')}</span>
                            <span className="s-row-desc">{t('darkThemeDesc')}</span>
                        </div>
                        <Toggle on={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} />
                    </div>
                </div>
            </section>

            {/* Data & Privacy */}
            <section className="s-section">
                <h3 className="s-section-title">{t('dataPrivacy')}</h3>
                <div className="s-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="s-btn-outline" onClick={handleExportData} disabled={isExporting}>
                        <Download size={18} />
                        {isExporting ? 'Exporting...' : t('exportData')}
                    </button>
                    <button className="s-btn-danger" onClick={handleDeleteAccount}>
                        <Trash2 size={18} />
                        {t('deleteAccount')}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <section className="s-footer">
                <Shield size={28} style={{ opacity: 0.3 }} />
                <p>Version 1.0.2</p>
            </section>
        </div>
    )
}
