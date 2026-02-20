import { MapPin, Shield, AlertTriangle } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'
import './LocationPermissionPage.css'

interface LocationPermissionPageProps {
    onPermissionGranted: () => void
    onSkip: () => void
}

export default function LocationPermissionPage({ onPermissionGranted, onSkip }: LocationPermissionPageProps) {
    const { showNotification } = useNotification()

    const handleEnableLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Location granted:', position.coords)
                    onPermissionGranted()
                },
                (error) => {
                    console.error('Location error:', error)
                    if (error.code === error.PERMISSION_DENIED) {
                        showNotification('Please enable location services in your browser settings to use this feature.', 'error')
                    }
                }
            )
        } else {
            showNotification('Geolocation is not supported by your browser.', 'error')
        }
    }

    return (
        <div className="location-permission-container">
            <div className="permission-card">
                {/* Header Section from screenshot */}
                <div className="card-header">
                    <div className="header-icon-bg">
                        <MapPin size={24} color="#3b82f6" />
                    </div>
                    <span className="header-title">Location Tracking</span>
                </div>

                {/* Status Section from screenshot */}
                <div className="status-row">
                    <div className="status-indicator inactive"></div>
                    <span className="status-text">Tracking Inactive</span>
                </div>

                <p className="permission-description">
                    Tour Guard requires location access to provide real-time safety alerts and emergency response.
                </p>

                {/* Button from screenshot */}
                <button onClick={handleEnableLocation} className="btn-start-tracking">
                    Start Location Tracking
                </button>

                <button onClick={onSkip} className="btn-skip-link">
                    Continue without location (Limited)
                </button>
            </div>
        </div>
    )
}
