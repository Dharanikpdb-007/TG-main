import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, MapPin, Phone, MessageCircle, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SOSEvent {
    id: string
    emergency_type: string
    description: string
    status: string
    latitude: number
    longitude: number
    created_at: string
}

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    triggered: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle, label: 'Waiting for responder...' },
    pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock, label: 'Pending Review' },
    responding: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Shield, label: 'Responder assigned' },
    solved: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle, label: 'Resolved' },
    not_solved: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertTriangle, label: 'Not Resolved' },
    closed: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', icon: CheckCircle, label: 'Closed by user' },
}

export default function SOSTrackingPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [events, setEvents] = useState<SOSEvent[]>([])
    const [selectedEvent, setSelectedEvent] = useState<SOSEvent | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchSOSEvents = async () => {
        if (!user?.id) return
        setIsLoading(true)
        const { data, error } = await supabase
            .from('sos_events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setEvents(data)
            if (data.length > 0 && !selectedEvent) {
                setSelectedEvent(data[0])
            }
        }
        if (error) console.error('Error fetching SOS events:', error)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchSOSEvents()
        const interval = setInterval(fetchSOSEvents, 10000)
        return () => clearInterval(interval)
    }, [user?.id])

    const handleCloseSOS = async (eventId: string) => {
        const { error } = await supabase
            .from('sos_events')
            .update({ status: 'closed' })
            .eq('id', eventId)
            .eq('user_id', user?.id)

        if (!error) {
            fetchSOSEvents()
        }
    }

    const getStatusInfo = (status: string) => {
        return statusConfig[status] || statusConfig.triggered
    }

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
        return new Date(dateStr).toLocaleDateString()
    }

    if (isLoading && events.length === 0) {
        return (
            <div style={{ padding: 20, textAlign: 'center', marginTop: 40 }}>
                <div className="spinner"></div>
                <p style={{ color: '#9ca3af', marginTop: 12 }}>Loading SOS events...</p>
            </div>
        )
    }

    // Detail view for a selected event
    if (selectedEvent) {
        const statusInfo = getStatusInfo(selectedEvent.status)
        const StatusIcon = statusInfo.icon

        return (
            <div className="view-container" style={{ padding: 0 }}>
                {/* Header */}
                <div style={{
                    background: '#e6a817',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ArrowLeft size={20} onClick={() => setSelectedEvent(null)} style={{ cursor: 'pointer' }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize' }}>
                                {selectedEvent.emergency_type} Emergency
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Help is on the way</div>
                        </div>
                    </div>
                    <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.color}`
                    }}>
                        {selectedEvent.status}
                    </span>
                </div>

                <div style={{ padding: 16 }}>
                    {/* Status Banner */}
                    <div style={{
                        background: statusInfo.bg,
                        border: `1px solid ${statusInfo.color}33`,
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 16
                    }}>
                        <StatusIcon size={18} color={statusInfo.color} />
                        <span style={{ color: statusInfo.color, fontWeight: 500 }}>{statusInfo.label}</span>
                    </div>

                    {/* Timeline */}
                    <div style={{
                        background: '#1a1b1e',
                        borderRadius: 12,
                        padding: 20,
                        marginBottom: 16,
                        borderLeft: `3px solid ${statusInfo.color}`
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 16 }}>Status Timeline</div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <CheckCircle size={18} color="#10b981" />
                            <div>
                                <div style={{ fontWeight: 500 }}>SOS Received</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatTime(selectedEvent.created_at)}</div>
                            </div>
                        </div>

                        {selectedEvent.status !== 'triggered' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <StatusIcon size={18} color={statusInfo.color} />
                                <div>
                                    <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{selectedEvent.status.replace('_', ' ')}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Updated by admin</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    {selectedEvent.latitude !== 0 && (
                        <div style={{
                            background: '#1a1b1e',
                            borderRadius: 12,
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 16
                        }}>
                            <MapPin size={18} color="#8b5cf6" />
                            <div>
                                <div style={{ fontWeight: 500 }}>Your Location Shared</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    Live location being shared with responders
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {selectedEvent.description && (
                        <div style={{
                            background: '#1a1b1e',
                            borderRadius: 12,
                            padding: '12px 16px',
                            marginBottom: 16
                        }}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Description</div>
                            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{selectedEvent.description}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <a href="tel:112" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#1a1b1e',
                        border: '1px solid #333',
                        borderRadius: 12,
                        padding: '14px',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 500,
                        marginBottom: 12
                    }}>
                        <Phone size={18} /> Call Emergency: 112
                    </a>

                    {selectedEvent.status !== 'closed' && selectedEvent.status !== 'solved' && (
                        <button
                            onClick={() => handleCloseSOS(selectedEvent.id)}
                            style={{
                                width: '100%',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 12,
                                padding: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                fontSize: '1rem'
                            }}
                        >
                            <CheckCircle size={18} /> I'm Safe - Close Incident
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // List view of all SOS events
    return (
        <div className="view-container" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <ArrowLeft size={20} onClick={() => navigate('/home')} style={{ cursor: 'pointer' }} />
                <h2 style={{ margin: 0 }}>My SOS History</h2>
            </div>

            {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <Shield size={48} color="#333" style={{ marginBottom: 12 }} />
                    <p>No SOS events found.</p>
                    <p style={{ fontSize: '0.85rem' }}>Your emergency alerts will appear here.</p>
                </div>
            ) : (
                events.map(event => {
                    const info = getStatusInfo(event.status)
                    const Icon = info.icon
                    return (
                        <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            style={{
                                background: '#1a1b1e',
                                borderRadius: 12,
                                padding: '16px',
                                marginBottom: 12,
                                cursor: 'pointer',
                                borderLeft: `3px solid ${info.color}`,
                                transition: 'transform 0.1s',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Icon size={18} color={info.color} />
                                    <div>
                                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                            {event.emergency_type} Emergency
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                            {formatTime(event.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    background: info.bg,
                                    color: info.color,
                                    textTransform: 'capitalize'
                                }}>
                                    {event.status.replace('_', ' ')}
                                </span>
                            </div>
                            {event.description && (
                                <p style={{
                                    marginTop: 8,
                                    fontSize: '0.85rem',
                                    color: '#9ca3af',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {event.description}
                                </p>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    )
}
