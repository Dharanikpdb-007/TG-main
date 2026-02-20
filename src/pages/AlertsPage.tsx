import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bell, AlertTriangle, Activity, Mic, Users, MapPin, Zap, BarChart2, Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './DashboardRedesign.css'

interface Alert {
    id: string
    message: string
    type: string
    created_at: string
}

export default function AlertsPage() {
    const navigate = useNavigate()
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    const [safetyScore, setSafetyScore] = useState(100)
    const [aiEnabled, setAiEnabled] = useState(localStorage.getItem('ai_sos_enabled') === 'true')

    // New Feature Flags
    const [featureFlags, setFeatureFlags] = useState<{ [key: string]: boolean }>({
        behavioral: true,
        voice: true,
        crowd: true,
        context: true,
        predictive: true
    })

    useEffect(() => {
        const saved = localStorage.getItem('ai_features_config')
        if (saved) {
            setFeatureFlags(JSON.parse(saved))
        }
    }, [])

    const toggleFeature = (id: string) => {
        const newState = { ...featureFlags, [id]: !featureFlags[id] }
        setFeatureFlags(newState)
        localStorage.setItem('ai_features_config', JSON.stringify(newState))
    }

    const toggleAi = () => {
        const newState = !aiEnabled
        setAiEnabled(newState)
        localStorage.setItem('ai_sos_enabled', newState.toString())
    }

    useEffect(() => {
        const fetchAlerts = async () => {
            const { data } = await supabase
                .from('admin_alerts')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(50)
            if (data) setAlerts(data)
            setLoading(false)
        }

        fetchAlerts()

        // Real-time subscription
        const subscription = supabase
            .channel('public:admin_alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_alerts' },
                payload => {
                    setAlerts(prev => [payload.new as Alert, ...prev])
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (!aiEnabled) {
            setSafetyScore(0)
            return
        }
        let score = 100
        const hour = new Date().getHours()

        // 1. Time based risk (Night time is riskier)
        if (hour >= 22 || hour < 5) score -= 10

        // 2. Location based risk (Red Zone)
        const inRedZone = localStorage.getItem('ai_red_zone_entry_ts') && localStorage.getItem('ai_red_zone_entry_ts') !== '0'
        if (inRedZone) score -= 30

        // 3. Active Alerts risk
        if (alerts.length > 0) {
            const highSev = alerts.filter(a => a.type === 'critical' || a.type === 'warning').length
            score -= (highSev * 10)
        }

        setSafetyScore(Math.max(score, 10)) // Min 10
    }, [alerts, aiEnabled])

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981' // Green
        if (score >= 50) return '#f59e0b' // Yellow
        return '#ef4444' // Red
    }

    const aiFeatures = [
        { id: 'behavioral', title: 'Behavioral Anomaly Detection', desc: 'ML-based unusual behavior analysis', icon: BarChart2, color: '#3b82f6' },
        { id: 'voice', title: 'Voice Stress Analysis', desc: 'Detects distress in voice patterns', icon: Mic, color: '#3b82f6' },
        { id: 'crowd', title: 'Crowd Density Intelligence', desc: 'Camera-based crowd safety analysis', icon: Users, color: '#3b82f6' },
        { id: 'context', title: 'Context-Aware Safety Scoring', desc: 'Real-time environment risk assessment', icon: MapPin, color: '#3b82f6' },
        { id: 'predictive', title: 'Predictive Emergency Alerts', desc: 'AI predicts emergencies before they happen', icon: AlertTriangle, color: '#3b82f6' },
    ]

    return (
        <div className="view-container" style={{ paddingBottom: 80 }}>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12 }}>
                    <ChevronLeft size={24} />
                </button>
                <h2>AI Safety Detection</h2>
            </div>

            {/* Safety Score Card */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '0.9rem' }}>Current Safety Score</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: aiEnabled ? getScoreColor(safetyScore) : '#6b7280' }}>
                        {aiEnabled ? `${safetyScore}%` : 'OFF'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: aiEnabled ? '#10b981' : '#6b7280', boxShadow: aiEnabled ? '0 0 8px #10b981' : 'none' }}></div>
                        <span style={{ fontSize: '0.8rem', color: aiEnabled ? '#10b981' : '#6b7280' }}>{aiEnabled ? 'AI Monitoring Active' : 'Monitoring Disabled'}</span>
                    </div>
                </div>

                {/* Visual Circle (CSS only) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 80, height: 80,
                        borderRadius: '50%',
                        border: `8px solid ${aiEnabled ? getScoreColor(safetyScore) : '#374151'}`,
                        borderRightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-45deg)',
                        opacity: aiEnabled ? 1 : 0.5
                    }}>
                        <Bell size={32} color={aiEnabled ? getScoreColor(safetyScore) : '#9ca3af'} style={{ transform: 'rotate(45deg)' }} />
                    </div>

                    <button
                        onClick={toggleAi}
                        style={{
                            background: aiEnabled ? '#10b981' : '#374151',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        {aiEnabled ? 'Turn OFF' : 'Turn ON'}
                    </button>
                </div>
            </div>

            {/* AI Detection Systems List */}
            <div style={{
                background: '#1f2937', // Darker background for the card
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Brain size={24} color="#3b82f6" /> {/* Blue Brain Icon */}
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>AI Detection Systems</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {aiFeatures.map((feature) => (
                        <div key={feature.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: 'rgba(59, 130, 246, 0.1)', // Light blue bg
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <feature.icon size={24} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                                        {feature.title}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                        {feature.desc}
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <div
                                onClick={() => toggleFeature(feature.id)}
                                style={{
                                    width: 44,
                                    height: 24,
                                    background: featureFlags[feature.id] ? '#3b82f6' : '#374151', // Blue active
                                    borderRadius: 24,
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s ease',
                                    flexShrink: 0
                                }}
                            >
                                <div style={{
                                    width: 18,
                                    height: 18,
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: 3,
                                    left: featureFlags[feature.id] ? 23 : 3,
                                    transition: 'left 0.3s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <h3 style={{ margin: '0 0 16px', color: '#e5e7eb', fontSize: '1.1rem' }}>Live Alerts</h3>

            {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Loading alerts...</div>
            ) : alerts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                    <Bell size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <p>No active alerts at the moment.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {alerts.map(alert => (
                        <div key={alert.id} style={{
                            background: alert.type === 'warning' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            border: `1px solid ${alert.type === 'warning' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            borderRadius: 12,
                            padding: 16,
                            display: 'flex',
                            gap: 16
                        }}>
                            <div style={{
                                background: alert.type === 'warning' ? '#ef4444' : '#3b82f6',
                                width: 40, height: 40, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <AlertTriangle size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: 4 }}>
                                    {new Date(alert.created_at).toLocaleString()}
                                </div>
                                <p style={{ margin: 0, color: 'white', lineHeight: 1.5 }}>
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
