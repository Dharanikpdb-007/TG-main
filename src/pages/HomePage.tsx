import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import SOSButton from '../components/SOSButton'
import LocationTracker from '../components/LocationTracker'
import { useNavigate } from 'react-router-dom'
import { Shield, User, MapPin, AlertTriangle, X, FileText, MessageSquare, Radar, Navigation, Users, Compass, BarChart3, Asterisk } from 'lucide-react'
import L from 'leaflet'
import { QRCodeCanvas } from 'qrcode.react'
import { useLanguage } from '../contexts/LanguageContext'
import './HomePage.css'

export default function HomePage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [userProfile, setUserProfile] = useState<any>(null)
    const [showQRModal, setShowQRModal] = useState(false)

    // Location & Risk State
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [locationName, setLocationName] = useState('Locating...')
    const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low')
    const [riskMessage, setRiskMessage] = useState("You're Safe")
    const [isLocationActive, setIsLocationActive] = useState(false)
    const [safetyScore, setSafetyScore] = useState(87.5)
    const [nearbyZoneName, setNearbyZoneName] = useState('')

    // Live Statistics State
    const [nearbyTouristsCount, setNearbyTouristsCount] = useState(0)
    const [activeAlertsCount, setActiveAlertsCount] = useState(0)

    useEffect(() => {
        if (user?.id) {
            loadUserProfile()
            fetchActiveAlerts()
        }
    }, [user?.id])

    useEffect(() => {
        if (currentLocation && user?.id) {
            fetchNearbyTourists(currentLocation.lat, currentLocation.lng)
        }
    }, [currentLocation, user?.id])

    const fetchActiveAlerts = async () => {
        try {
            const { count, error } = await supabase
                .from('incident_reports')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .in('status', ['reported', 'investigating', 'under_review']) // Active statuses

            if (error) throw error
            setActiveAlertsCount(count || 0)
        } catch (err) {
            console.error('Error fetching active alerts:', err)
        }
    }

    const fetchNearbyTourists = async (lat: number, lng: number) => {
        try {
            // Define a rough bounding box (~10km) to avoid fetching all users
            // 1 deg lat ~ 111km. 0.1 deg ~ 11km.
            const range = 0.1
            const minLat = lat - range
            const maxLat = lat + range
            const minLng = lng - range
            const maxLng = lng + range

            const { data: users, error } = await supabase
                .from('users')
                .select('id, current_latitude, current_longitude')
                .neq('id', user?.id) // Exclude self
                .gte('current_latitude', minLat)
                .lte('current_latitude', maxLat)
                .gte('current_longitude', minLng)
                .lte('current_longitude', maxLng)

            if (error) throw error

            // Client-side precise filtering
            let count = 0
            if (users) {
                users.forEach(u => {
                    if (u.current_latitude && u.current_longitude) {
                        const dist = calculateDistance(lat, lng, u.current_latitude, u.current_longitude)
                        if (dist <= 5) { // 5km radius
                            count++
                        }
                    }
                })
            }
            setNearbyTouristsCount(count)
        } catch (err) {
            console.error('Error fetching nearby tourists:', err)
        }
    }

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371 // km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    useEffect(() => {
        if (showQRModal && user?.id) {
            loadUserProfile()
        }
    }, [showQRModal, user?.id])

    // Watch location and calculate risk
    useEffect(() => {
        if (!navigator.geolocation) {
            setIsLocationActive(false)
            return
        }

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                setCurrentLocation({ lat: latitude, lng: longitude })
                setIsLocationActive(true)

                // Reverse geocode
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                    const data = await res.json()
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
                    const country = data.address?.country || ''
                    setLocationName(city ? `${city}, ${country}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
                } catch {
                    setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
                }

                await checkRiskLevel(latitude, longitude)
            },
            (err) => {
                console.error(err)
                setIsLocationActive(false)
            },
            { enableHighAccuracy: true }
        )

        return () => navigator.geolocation.clearWatch(watchId)
    }, [user?.id])

    const loadUserProfile = async () => {
        const { data } = await supabase.from('users')
            .select('digital_id, name, passport_number, entry_date, exit_date')
            .eq('id', user?.id)
            .single()

        if (data) setUserProfile(data)
    }

    const checkRiskLevel = async (lat: number, lng: number) => {
        const { data: zones } = await supabase.from('trusted_zones').select('*')
        let newRisk: 'Low' | 'Medium' | 'High' = 'Low'
        let message = "You're Safe"
        let score = 87.5
        let zone_name = ''

        if (zones) {
            zones.forEach((zone: any) => {
                const zoneCenter = L.latLng(zone.latitude, zone.longitude)
                const userPos = L.latLng(lat, lng)
                const distance = userPos.distanceTo(zoneCenter)

                if (distance <= zone.radius_meters) {
                    if (zone.zone_type === 'danger') {
                        newRisk = 'High'
                        message = `Danger Zone`
                        score = 25
                        zone_name = zone.zone_name
                    } else if (zone.zone_type === 'medium' && newRisk !== 'High') {
                        newRisk = 'Medium'
                        message = `Caution Advised`
                        score = 55
                        zone_name = zone.zone_name
                    } else if (zone.zone_type === 'safe' && newRisk === 'Low') {
                        zone_name = zone.zone_name
                    }
                }
            })
        }
        setRiskLevel(newRisk)
        setRiskMessage(message)
        setSafetyScore(score)
        setNearbyZoneName(zone_name)
    }

    // QR Data
    const getQRData = () => {
        const name = userProfile?.name || 'Guest User';
        const passport = userProfile?.passport_number || 'N/A';
        const entry = userProfile?.entry_date || 'N/A';
        const exit = userProfile?.exit_date || 'N/A';
        const ref = userProfile?.digital_id || user?.id || 'Unknown';

        return `TOUR GUARD DIGITAL ID\n\nName: ${name}\nPassport: ${passport}\nEntry: ${entry}\nExit: ${exit}\nRef: ${ref}`;
    }

    const displayId = userProfile?.digital_id || user?.id?.substring(0, 12) || 'Generating...'

    // Score color logic
    const getScoreColor = () => {
        if (safetyScore >= 70) return '#10b981'
        if (safetyScore >= 40) return '#f59e0b'
        return '#ef4444'
    }

    const scoreColor = getScoreColor()

    // Progress bar percentage
    const scorePercent = Math.min(100, Math.max(0, safetyScore))

    // Sub-scores
    const locationScore = riskLevel === 'Low' ? 95 : riskLevel === 'Medium' ? 65 : 25
    const behaviourScore = 85
    const environmentScore = riskLevel === 'Low' ? 82 : riskLevel === 'Medium' ? 55 : 30

    return (
        <div className="safer-home">
            {/* AI Safety Score Card */}
            <div className="safety-score-card">
                <div className="score-card-content">
                    <div className="score-info">
                        <h2 className="score-title">{t('aiSafetyScore')}</h2>
                        <span className="score-risk-label" style={{ color: scoreColor }}>
                            {riskLevel === 'Low' ? t('lowRisk') : riskLevel === 'Medium' ? t('mediumRisk') : t('highRisk')}
                        </span>
                        <span className="score-updated">{t('lastUpdated')}</span>
                    </div>
                    <div className="score-rect-badge" style={{ borderColor: `${scoreColor}33` }}>
                        <span className="score-rect-value" style={{ color: scoreColor }}>{safetyScore.toFixed(1)}</span>
                        <div className="score-rect-bar-track">
                            <div className="score-rect-bar-fill" style={{ width: `${scorePercent}%`, background: scoreColor }} />
                        </div>
                        <span className="score-rect-max">/100</span>
                    </div>
                </div>

                {/* Sub Metrics */}
                <div className="score-sub-metrics">
                    <div className="sub-metric" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' }}>
                        <span className="sub-label">Location</span>
                        <span className="sub-value" style={{ color: '#10b981' }}>{locationScore}%</span>
                    </div>
                    <div className="sub-metric" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' }}>
                        <span className="sub-label">Behaviour</span>
                        <span className="sub-value" style={{ color: '#10b981' }}>{behaviourScore}%</span>
                    </div>
                    <div className="sub-metric" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' }}>
                        <span className="sub-label">Environment</span>
                        <span className="sub-value" style={{ color: '#10b981' }}>{environmentScore}%</span>
                    </div>
                </div>
            </div>

            {/* Current Location Status */}
            <div className="location-status-card">
                <div className="location-status-header">
                    <MapPin size={18} color="#10b981" />
                    <span className="location-status-title">{t('currentLocationStatus')}</span>
                </div>
                <div className="location-status-body">
                    <div className="location-details">
                        <span className="location-city">{locationName}</span>
                        <span className="location-zone-info">
                            {nearbyZoneName ? nearbyZoneName : (isLocationActive ? 'Safe Tourist Zone' : 'Location not active')}
                            {isLocationActive && ' • Well-lit area'}
                        </span>
                    </div>
                    <div className={`safe-badge ${riskLevel === 'Low' ? 'safe' : riskLevel === 'Medium' ? 'warning' : 'danger'}`}>
                        {riskLevel === 'Low' ? (
                            <><Shield size={14} /> SAFE</>
                        ) : riskLevel === 'Medium' ? (
                            <><AlertTriangle size={14} /> CAUTION</>
                        ) : (
                            <><AlertTriangle size={14} /> DANGER</>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Title */}
            <h3 className="section-title">{t('quickActions')}</h3>

            {/* Quick Actions Grid */}
            <div className="quick-actions-grid">
                <div className="qa-card emergency" onClick={() => navigate('/sos')}>
                    <div className="qa-icon-wrap emergency-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <span className="qa-label">{t('emergencyPanic')}</span>
                </div>

                <div className="qa-card incident" onClick={() => navigate('/incident-log')}>
                    <div className="qa-icon-wrap incident-icon">
                        <FileText size={24} />
                    </div>
                    <span className="qa-label">{t('reportIncident')}</span>
                </div>

                <div className="qa-card nearby" onClick={() => navigate('/nearby-incidents')}>
                    <div className="qa-icon-wrap nearby-icon">
                        <Navigation size={24} />
                    </div>
                    <span className="qa-label">{t('nearbyIncidents')}</span>
                </div>

                <div className="qa-card ai-detect" onClick={() => navigate('/alerts')}>
                    <div className="qa-icon-wrap ai-detect-icon">
                        <Radar size={24} />
                    </div>
                    <span className="qa-label">{t('aiSafetyDetection')}</span>
                </div>

                <div className="qa-card chatbot" onClick={() => navigate('/chatbot')}>
                    <div className="qa-icon-wrap chatbot-icon">
                        <MessageSquare size={24} />
                    </div>
                    <span className="qa-label">{t('smartChatbot')}</span>
                </div>

                <div className="qa-card profile-mgr" onClick={() => navigate('/profile-id')}>
                    <div className="qa-icon-wrap profile-icon">
                        <User size={24} />
                    </div>
                    <span className="qa-label">{t('profileManager')}</span>
                </div>

                <div className="qa-card community" onClick={() => navigate('/community')}>
                    <div className="qa-icon-wrap community-icon">
                        <Users size={24} />
                    </div>
                    <span className="qa-label">{t('communityInteraction')}</span>
                </div>

                <div className="qa-card places" onClick={() => navigate('/places')}>
                    <div className="qa-icon-wrap places-icon">
                        <Compass size={24} />
                    </div>
                    <span className="qa-label">{t('nearbyPlaces')}</span>
                </div>
            </div>

            {/* Live Statistics */}
            <div className="live-stats-section">
                <div className="live-stats-header">
                    <BarChart3 size={20} color="#60a5fa" />
                    <h3>{t('liveStatistics')}</h3>
                </div>
                <div className="live-stats-grid">
                    <div className="stat-item tourists">
                        <Users size={18} className="stat-icon" />
                        <span className="stat-number">{nearbyTouristsCount}</span>
                        <span className="stat-desc">{t('nearbyTourists')}</span>
                    </div>
                    <div className="stat-item alerts-stat">
                        <AlertTriangle size={18} className="stat-icon" />
                        <span className="stat-number">{activeAlertsCount}</span>
                        <span className="stat-desc">{t('activeAlerts')}</span>
                    </div>
                    <div className="stat-item response">
                        <Asterisk size={18} className="stat-icon" />
                        <span className="stat-number">&lt; 5 min</span>
                        <span className="stat-desc">{t('emergencyResponse')}</span>
                    </div>
                    <div className="stat-item confidence">
                        <Shield size={18} className="stat-icon" />
                        <span className="stat-number">94.7%</span>
                        <span className="stat-desc">{t('aiConfidence')}</span>
                    </div>
                </div>
            </div>


            {/* QR Modal */}
            {showQRModal && (
                <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
                    <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowQRModal(false)} className="qr-close-btn">
                            <X size={24} color="#333" />
                        </button>
                        <h3 style={{ margin: '0 0 24px', color: '#1a1b1e' }}>Digital Tourist ID</h3>
                        <div style={{ padding: 16, background: 'white', borderRadius: 12, display: 'inline-block' }}>
                            <QRCodeCanvas value={getQRData()} size={200} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} />
                        </div>
                        <div style={{ marginTop: 24, padding: '0 10px' }}>
                            <p style={{ fontSize: '1rem', color: '#1a1b1e', marginBottom: 8, fontWeight: 700 }}>
                                ID: {displayId}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                Scan this QR code to view full tourist details and verified status.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
