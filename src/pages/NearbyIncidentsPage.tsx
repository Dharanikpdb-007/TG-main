import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChevronLeft, AlertTriangle, MapPin, Clock, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './NearbyIncidentsPage.css'

interface NearbyIncident {
    id: string
    incident_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    status: string
    created_at: string
    location_latitude?: number
    location_longitude?: number
    user: {
        name: string
    } | null
}

export default function NearbyIncidentsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [incidents, setIncidents] = useState<NearbyIncident[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'recent' | 'critical'>('all')

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        loadNearbyIncidents()
    }, [user?.id])

    const loadNearbyIncidents = async () => {
        if (!user?.id) return
        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from('incident_reports')
                .select(`
                    id,
                    incident_type,
                    severity,
                    description,
                    status,
                    created_at,
                    location_latitude,
                    location_longitude,
                    user_id,
                    users:user_id (name)
                `)
                .neq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setIncidents((data as any[]) || [])
        } catch (err) {
            console.error('Error loading nearby incidents:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444'
            case 'high': return '#f97316'
            case 'medium': return '#f59e0b'
            case 'low': return '#10b981'
            default: return '#6b7280'
        }
    }

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case 'critical': return 'rgba(239, 68, 68, 0.1)'
            case 'high': return 'rgba(249, 115, 22, 0.1)'
            case 'medium': return 'rgba(245, 158, 11, 0.1)'
            case 'low': return 'rgba(16, 185, 129, 0.1)'
            default: return 'rgba(107, 114, 128, 0.1)'
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const formatIncidentType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }

    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'recent') {
            const hourAgo = Date.now() - 3600000
            return new Date(inc.created_at).getTime() > hourAgo
        }
        if (filter === 'critical') {
            return inc.severity === 'critical' || inc.severity === 'high'
        }
        return true
    })

    return (
        <div className="nearby-incidents-page">
            {/* Header */}
            <div className="ni-header">
                <button onClick={() => navigate(-1)} className="ni-back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h2>Nearby Incidents</h2>
                <span className="ni-count">{incidents.length}</span>
            </div>

            {/* Filter Tabs */}
            <div className="ni-filters">
                <button
                    className={`ni-filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`ni-filter-btn ${filter === 'recent' ? 'active' : ''}`}
                    onClick={() => setFilter('recent')}
                >
                    Last Hour
                </button>
                <button
                    className={`ni-filter-btn ${filter === 'critical' ? 'active' : ''}`}
                    onClick={() => setFilter('critical')}
                >
                    Critical
                </button>
            </div>

            {/* Incidents List */}
            {isLoading ? (
                <div className="ni-loading">
                    <div className="ni-spinner" />
                    <span>Loading incidents...</span>
                </div>
            ) : filteredIncidents.length === 0 ? (
                <div className="ni-empty">
                    <AlertTriangle size={40} color="#6b7280" />
                    <h3>No Incidents Found</h3>
                    <p>
                        {filter === 'all'
                            ? 'No incidents have been reported by other users yet.'
                            : filter === 'recent'
                                ? 'No incidents reported in the last hour.'
                                : 'No critical or high severity incidents.'}
                    </p>
                </div>
            ) : (
                <div className="ni-list">
                    {filteredIncidents.map((incident) => (
                        <div key={incident.id} className="ni-card">
                            <div className="ni-card-header">
                                <div
                                    className="ni-severity-badge"
                                    style={{
                                        background: getSeverityBg(incident.severity),
                                        color: getSeverityColor(incident.severity),
                                        borderColor: `${getSeverityColor(incident.severity)}33`
                                    }}
                                >
                                    <AlertTriangle size={12} />
                                    {incident.severity.toUpperCase()}
                                </div>
                                <span className="ni-time">
                                    <Clock size={12} />
                                    {formatTime(incident.created_at)}
                                </span>
                            </div>

                            <h4 className="ni-type">{formatIncidentType(incident.incident_type)}</h4>

                            <p className="ni-description">{incident.description}</p>

                            <div className="ni-card-footer">
                                <span className="ni-reporter">
                                    <User size={13} />
                                    {(incident as any).users?.name || 'Anonymous'}
                                </span>
                                {incident.location_latitude && (
                                    <span className="ni-location">
                                        <MapPin size={13} />
                                        {incident.location_latitude.toFixed(3)}, {incident.location_longitude?.toFixed(3)}
                                    </span>
                                )}
                                <span
                                    className="ni-status"
                                    style={{
                                        color: incident.status === 'resolved' ? '#10b981' : '#f59e0b'
                                    }}
                                >
                                    {incident.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
