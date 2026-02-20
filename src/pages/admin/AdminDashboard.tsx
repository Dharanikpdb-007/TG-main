import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LayoutDashboard, AlertTriangle, FileText, Map as MapIcon, LogOut, Bell, User, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import './Admin.css'

// Fix for default Leaflet icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [24, 41],
    iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Placeholders for sub-components
const StatsView = () => {
    const [stats, setStats] = useState({ sos: 0, incidents: 0, users: 0 })

    useEffect(() => {
        // Mock fetch or real DB count
        const fetchStats = async () => {
            const { count: sosCount } = await supabase.from('sos_events').select('*', { count: 'exact' })
            const { count: incCount } = await supabase.from('incident_reports').select('*', { count: 'exact' })
            const { count: userCount } = await supabase.from('users').select('*', { count: 'exact' })
            setStats({ sos: sosCount || 0, incidents: incCount || 0, users: userCount || 0 })
        }
        fetchStats()
    }, [])

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard Overview</h2>
                <p>Welcome back, Administrator.</p>
            </div>
            <div className="stats-grid">
                <div className="stat-card">
                    <AlertTriangle size={32} color="#ef4444" />
                    <div className="stat-value">{stats.sos}</div>
                    <div className="stat-label">Total SOS Alerts</div>
                </div>
                <div className="stat-card">
                    <FileText size={32} color="#f59e0b" />
                    <div className="stat-value">{stats.incidents}</div>
                    <div className="stat-label">Incident Reports</div>
                </div>
                <div className="stat-card">
                    <Shield size={32} color="#8b5cf6" />
                    <div className="stat-value">{stats.users}</div>
                    <div className="stat-label">Active Users</div>
                </div>
            </div>
        </div>
    )
}

const IncidentsView = () => {
    const [incidents, setIncidents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchIncidents = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from('incident_reports').select('*, users(name, email)').order('created_at', { ascending: false }).limit(20)
        if (data) setIncidents(data)
        if (error) console.error('Error fetching incidents:', error)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchIncidents()
        // Auto-refresh every 15 seconds
        const interval = setInterval(fetchIncidents, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Incident Logs</h2>
                    <p>Recent incident reports from users.</p>
                </div>
                <button onClick={fetchIncidents} className="btn-admin-login" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    <RefreshCw size={16} className={isLoading ? 'spin-anim' : ''} /> Refresh
                </button>
            </div>
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Reported By</th>
                            <th>Type</th>
                            <th>Severity</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map(inc => (
                            <tr key={inc.id}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{inc.users?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{inc.users?.email || ''}</div>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{inc.incident_type}</td>
                                <td>
                                    <span className={`status-badge ${inc.severity}`}>{inc.severity}</span>
                                </td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {inc.description}
                                </td>
                                <td>{inc.status}</td>
                                <td>{new Date(inc.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {incidents.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>No incidents reported yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const AlertsView = () => {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    const handleSendAlert = async () => {
        if (!message) return
        setIsSending(true)

        try {
            const { error } = await supabase.from('admin_alerts').insert({
                message,
                type: 'warning',
                is_active: true
            })
            if (error) throw error
            alert('Alert broadcasted to all active users!')
            setMessage('')
        } catch (err) {
            console.error('Error sending alert:', err)
            alert('Failed to send alert')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <h2>Send Alert Notification</h2>
                <p>Broadcast emergency messages to all users in a specific area.</p>
            </div>

            <div className="admin-login-card" style={{ maxWidth: '600px', margin: '0' }}>
                <div className="form-group">
                    <label>Alert Message</label>
                    <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter alert details (e.g. Heavy rain warning in Mumbai...)"
                        style={{ width: '100%', padding: 12, borderRadius: 8, background: '#0f1013', border: '1px solid #333', color: 'white' }}
                    />
                </div>
                <button onClick={handleSendAlert} disabled={isSending} className="btn-admin-login" style={{ background: '#ef4444' }}>
                    <Bell size={18} /> {isSending ? 'Broadcasting...' : 'Broadcast Alert'}
                </button>
            </div>
        </div>
    )
}

const LocationTrackingView = () => {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchUserLocations = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('users')
            .select('id, name, email, current_latitude, current_longitude, last_location_update')
            .not('current_latitude', 'is', null)
            .not('current_longitude', 'is', null)

        if (data) setUsers(data)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchUserLocations()
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchUserLocations, 30000)
        return () => clearInterval(interval)
    }, [])

    function FlyToUser({ user }: { user: any }) {
        const map = useMap()
        useEffect(() => {
            if (user) {
                map.flyTo([user.current_latitude, user.current_longitude], 15)
            }
        }, [user, map])
        return null
    }

    return (
        <div style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Live User Tracking</h2>
                    <p>Monitor real-time locations of active users.</p>
                </div>
                <button onClick={fetchUserLocations} className="btn-admin-login" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    <RefreshCw size={16} className={isLoading ? 'spin-anim' : ''} /> Refresh
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden' }}>
                {/* User List Sidebar */}
                <div style={{ width: 300, background: '#1a1b1e', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 16, borderBottom: '1px solid #333', fontWeight: 600 }}>
                        Active Users ({users.length})
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {users.map(user => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #222',
                                    cursor: 'pointer',
                                    background: selectedUser?.id === user.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    borderLeft: selectedUser?.id === user.id ? '3px solid #3b82f6' : '3px solid transparent'
                                }}
                            >
                                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <User size={14} color="#9ca3af" /> {user.name || 'Anonymous'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                                    Last seen: {new Date(user.last_location_update).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                                No active users found with location data.
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Container */}
                <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {users.map(user => (
                            <Marker
                                key={user.id}
                                position={[user.current_latitude, user.current_longitude]}
                                eventHandlers={{
                                    click: () => setSelectedUser(user),
                                }}
                            >
                                <Popup>
                                    <strong>{user.name}</strong><br />
                                    {user.email}<br />
                                    Updated: {new Date(user.last_location_update).toLocaleString()}
                                </Popup>
                            </Marker>
                        ))}
                        <FlyToUser user={selectedUser} />
                    </MapContainer>
                </div>
            </div>
        </div>
    )
}

const SOSLogsView = () => {
    const [sosEvents, setSOSEvents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchSOSEvents = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('sos_events')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setSOSEvents(data)
        if (error) console.error('Error fetching SOS events:', error)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchSOSEvents()
        const interval = setInterval(fetchSOSEvents, 15000)
        return () => clearInterval(interval)
    }, [])

    const updateStatus = async (eventId: string, newStatus: string) => {
        const { error } = await supabase
            .from('sos_events')
            .update({ status: newStatus })
            .eq('id', eventId)

        if (!error) {
            setSOSEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e))
        } else {
            console.error('Error updating status:', error)
            alert('Failed to update status')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'solved': return '#10b981'
            case 'pending': return '#f59e0b'
            case 'triggered': return '#f59e0b'
            case 'responding': return '#3b82f6'
            case 'not_solved': return '#ef4444'
            case 'closed': return '#6b7280'
            default: return '#9ca3af'
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>SOS Event Logs</h2>
                    <p>Monitor and manage emergency SOS alerts from users.</p>
                </div>
                <button onClick={fetchSOSEvents} className="btn-admin-login" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    <RefreshCw size={16} className={isLoading ? 'spin-anim' : ''} /> Refresh
                </button>
            </div>
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sosEvents.map(event => (
                            <tr key={event.id}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{event.users?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{event.users?.email || ''}</div>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{event.emergency_type}</td>
                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {event.description || '-'}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                    {event.latitude && event.longitude
                                        ? `${Number(event.latitude).toFixed(4)}, ${Number(event.longitude).toFixed(4)}`
                                        : 'N/A'}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{new Date(event.created_at).toLocaleString()}</td>
                                <td>
                                    <select
                                        value={event.status}
                                        onChange={(e) => updateStatus(event.id, e.target.value)}
                                        style={{
                                            background: '#0f1013',
                                            color: getStatusColor(event.status),
                                            border: `1px solid ${getStatusColor(event.status)}44`,
                                            borderRadius: 8,
                                            padding: '6px 10px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="triggered">Triggered</option>
                                        <option value="pending">Pending</option>
                                        <option value="responding">Responding</option>
                                        <option value="solved">Solved</option>
                                        <option value="not_solved">Not Solved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {sosEvents.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>No SOS events recorded yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('dashboard')

    const handleLogout = () => {
        localStorage.removeItem('admin_auth')
        navigate('/admin')
    }

    return (
        <div className="admin-dashboard-layout">
            {/* Sidebar */}
            <div className="admin-sidebar">
                <div className="sidebar-header">
                    <Shield size={28} color="#8b5cf6" />
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>TG Admin</span>
                </div>

                <div className="sidebar-nav">
                    <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={20} /> Dashboard
                    </div>
                    <div className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`} onClick={() => setActiveTab('incidents')}>
                        <FileText size={20} /> Incidents
                    </div>
                    {/* Reusing existing Map Logic would require passing 'editable' props, for now simplified */}
                    <div className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => navigate('/map')}>
                        <MapIcon size={20} /> Zone Map (Live)
                    </div>
                    <div className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                        <Bell size={20} /> Alerts
                    </div>
                    <div className={`nav-item ${activeTab === 'tracking' ? 'active' : ''}`} onClick={() => setActiveTab('tracking')}>
                        <MapIcon size={20} /> User Tracking
                    </div>
                    <div className={`nav-item ${activeTab === 'sos' ? 'active' : ''}`} onClick={() => setActiveTab('sos')}>
                        <AlertTriangle size={20} /> SOS Logs
                    </div>
                </div>

                <div className="admin-logout">
                    <div className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
                        <LogOut size={20} /> Logout
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-content">
                {activeTab === 'dashboard' && <StatsView />}
                {activeTab === 'incidents' && <IncidentsView />}
                {activeTab === 'alerts' && <AlertsView />}
                {activeTab === 'tracking' && <LocationTrackingView />}
                {activeTab === 'sos' && <SOSLogsView />}
            </div>
        </div>
    )
}
