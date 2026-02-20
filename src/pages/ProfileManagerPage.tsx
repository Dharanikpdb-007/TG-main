import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChevronLeft, CreditCard, Calendar, User, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'

export default function ProfileManagerPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [showQR, setShowQR] = useState(false)
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error) throw error
                setUserData(data)
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [user?.id])

    const getQRData = () => {
        if (!userData) return ''
        return JSON.stringify({
            id: userData.digital_id || userData.id,
            name: userData.name,
            passport: userData.passport_number,
            entry: userData.entry_date,
            exit: userData.exit_date,
            status: 'Active'
        })
    }

    if (loading) {
        return (
            <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>
                Loading Profile...
            </div>
        )
    }

    return (
        <div className="view-container" style={{ paddingBottom: 80, background: '#0f1013', minHeight: '100vh' }}>
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 24, padding: 20 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12, cursor: 'pointer' }}>
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Profile Manager</h2>
            </div>

            <div style={{ padding: '0 20px' }}>
                {/* ID Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    borderRadius: 20,
                    padding: 24,
                    marginBottom: 24,
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div style={{
                            width: 64, height: 64,
                            borderRadius: '50%',
                            background: '#374151',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            border: '2px solid #3b82f6'
                        }}>
                            {userData?.profile_picture ? (
                                <img src={userData.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={32} color="#9ca3af" />
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px', color: 'white', fontSize: '1.2rem' }}>{userData?.name || 'Guest User'}</h3>
                            <div style={{
                                color: '#10b981',
                                fontSize: '0.85rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 10px',
                                borderRadius: 12,
                                display: 'inline-block',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                ● Status: Location Active
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Digital ID</div>
                            <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 1 }}>
                                {userData?.digital_id?.substring(0, 12) || userData?.id?.substring(0, 12)}...
                            </div>
                        </div>
                        <button
                            onClick={() => setShowQR(!showQR)}
                            style={{
                                background: showQR ? '#4b5563' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'background 0.2s'
                            }}
                        >
                            {showQR ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showQR ? 'Hide ID' : 'View ID'}
                        </button>
                    </div>

                    {/* QR Code Section (Expandable) */}
                    {showQR && (
                        <div style={{
                            marginTop: 20,
                            background: 'white',
                            padding: 24,
                            borderRadius: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            animation: 'fadeIn 0.3s ease'
                        }}>
                            <QRCodeCanvas value={getQRData()} size={200} />
                            <p style={{ marginTop: 16, color: '#111827', fontWeight: 700, fontSize: '1.1rem' }}>
                                {userData?.digital_id || userData?.id}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                                Official Tourist Digital Identity
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Grid */}
                <h3 style={{ color: '#e5e7eb', fontSize: '1.1rem', marginBottom: 16 }}>Travel Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>

                    {/* Phone */}
                    <div style={{
                        background: '#1f2937',
                        padding: 16,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: 8 }}>
                            <User size={20} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Phone Number</div>
                            <div style={{ color: 'white', fontWeight: 500 }}>{userData?.phone || 'Not added'}</div>
                        </div>
                    </div>

                    {/* Passport */}
                    <div style={{
                        background: '#1f2937',
                        padding: 16,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: 8, borderRadius: 8 }}>
                            <CreditCard size={20} color="#a855f7" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Passport Number</div>
                            <div style={{ color: 'white', fontWeight: 500 }}>{userData?.passport_number || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Entry/Exit Dates Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{
                            background: '#1f2937',
                            padding: 16,
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Calendar size={16} color="#10b981" />
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Entry Date</span>
                            </div>
                            <div style={{ color: 'white', fontWeight: 500 }}>{userData?.entry_date || 'N/A'}</div>
                        </div>

                        <div style={{
                            background: '#1f2937',
                            padding: 16,
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Calendar size={16} color="#ef4444" />
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Exit Date</span>
                            </div>
                            <div style={{ color: 'white', fontWeight: 500 }}>{userData?.exit_date || 'N/A'}</div>
                        </div>
                    </div>



                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
