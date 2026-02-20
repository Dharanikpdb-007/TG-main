import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Phone, Map as MapIcon, CreditCard, Settings, ChevronRight, LogOut, ChevronLeft, AlertTriangle, Edit2, Check, X, Calendar, FileText } from 'lucide-react'
import EmergencyContactsList from '../components/EmergencyContactsList'
import AddContactForm from '../components/AddContactForm'
import { EmergencyContact } from '../types'
import './DashboardRedesign.css'

export default function ProfileView() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    // Specific sub-views for Profile tab
    const [profileView, setProfileView] = useState<'main' | 'contacts'>('main')

    // Data State
    const [userProfile, setUserProfile] = useState<any>(null)
    const [contacts, setContacts] = useState<EmergencyContact[]>([])
    const [showAddContact, setShowAddContact] = useState(false)
    const [contactCount, setContactCount] = useState(0)

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        nationality: '',
        passport_number: '',
        entry_date: '',
        exit_date: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (user?.id) {
            loadUserProfile()
            loadContacts()
        }
    }, [user?.id])

    const loadUserProfile = async () => {
        const { data } = await supabase.from('users').select('*').eq('id', user?.id).single()
        if (data) {
            setUserProfile(data)
            setEditForm({
                name: data.name || '',
                phone: data.phone || '',
                nationality: data.nationality || '',
                passport_number: data.passport_number || '',
                entry_date: data.entry_date || '',
                exit_date: data.exit_date || ''
            })
        }
    }

    const loadContacts = async () => {
        const { data, count } = await supabase.from('emergency_contacts').select('*', { count: 'exact' }).eq('user_id', user?.id)
        if (data) {
            setContacts(data)
            setContactCount(count || data.length)
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase.from('users').update({
                name: editForm.name,
                phone: editForm.phone,
                nationality: editForm.nationality,
                passport_number: editForm.passport_number,
                entry_date: editForm.entry_date || null,
                exit_date: editForm.exit_date || null
            }).eq('id', user?.id)

            if (error) throw error

            await loadUserProfile()
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setIsSaving(false)
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
            console.error('Sign out error:', error)
        }
    }

    const renderContactsSubView = () => (
        <div className="view-container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, padding: '0 16px', marginTop: 16 }}>
                <button onClick={() => setProfileView('main')} style={{ background: 'none', border: 'none', color: 'white', marginRight: 10 }}>
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Emergency Contacts</h2>
            </div>

            <div style={{ padding: '0 16px' }}>
                {contacts.length === 0 && !showAddContact && (
                    <div className="empty-state" style={{ textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                        <p>No emergency contacts added yet</p>
                        <button
                            onClick={() => setShowAddContact(true)}
                            className="btn-secondary"
                            style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, background: '#8b5cf6', color: 'white', border: 'none' }}
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
                                    style={{ width: '100%', padding: 16, marginTop: 20, background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12 }}
                                >
                                    + Add Another Contact
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )

    const renderProfileMain = () => (
        <div className="view-container">
            {/* Digital ID Link */}
            <div
                onClick={() => navigate('/profile-id')}
                style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 48, height: 48,
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CreditCard size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Digital ID Card</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>View your official ID & QR Code</p>
                    </div>
                </div>
                <ChevronRight size={20} color="#6b7280" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className="profile-section-title" style={{ margin: 0 }}>My Profile</h2>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#8b5cf6', display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Edit2 size={16} /> Edit
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#9ca3af' }}>
                            <X size={20} />
                        </button>
                        <button onClick={handleSaveProfile} disabled={isSaving} style={{ background: 'none', border: 'none', color: '#10b981' }}>
                            <Check size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="profile-card-list">
                {!isEditing ? (
                    // VIEW MODE
                    <>
                        <div className="profile-info-row">
                            <User size={20} color="#a78bfa" />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Full Name</div>
                                <div>{userProfile?.name || 'Not set'}</div>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <Phone size={20} color="#a78bfa" />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Phone</div>
                                <div>{userProfile?.phone || 'Not set'}</div>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <MapIcon size={20} color="#a78bfa" />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Nationality</div>
                                <div>{userProfile?.nationality || 'Not set'}</div>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <FileText size={20} color="#a78bfa" />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Passport Number</div>
                                <div>{userProfile?.passport_number || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <Calendar size={20} color="#a78bfa" />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Entry Date</div>
                                <div>{userProfile?.entry_date || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <Calendar size={20} color="#a78bfa" />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Exit Date</div>
                                <div>{userProfile?.exit_date || 'N/A'}</div>
                            </div>
                        </div>
                    </>
                ) : (
                    // EDIT MODE
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Full Name</label>
                            <input className="form-input" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #333' }}
                                value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Phone</label>
                            <input className="form-input" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #333' }}
                                value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Nationality</label>
                            <input className="form-input" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #333' }}
                                value={editForm.nationality} onChange={e => setEditForm({ ...editForm, nationality: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Passport Number</label>
                            <input className="form-input" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #333' }}
                                value={editForm.passport_number} onChange={e => setEditForm({ ...editForm, passport_number: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Entry Date</label>
                                <input type="date" className="form-input" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #333' }}
                                    value={editForm.entry_date} onChange={e => setEditForm({ ...editForm, entry_date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Exit Date</label>
                                <input type="date" className="form-input" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #333' }}
                                    value={editForm.exit_date} onChange={e => setEditForm({ ...editForm, exit_date: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <h2 className="profile-section-title">Manage</h2>

            <div className="menu-item" onClick={() => setProfileView('contacts')}>
                <User size={20} />
                <span style={{ flex: 1 }}>Emergency Contacts</span>
                <div style={{ background: '#8b5cf6', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{contactCount}</div>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </div>

            <div className="menu-item" onClick={() => navigate('/incident-log')}>
                <AlertTriangle size={20} />
                <span style={{ flex: 1 }}>Incident Report Log</span>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </div>

            <div className="menu-item" onClick={() => navigate('/settings')}>
                <Settings size={20} />
                <span style={{ flex: 1 }}>Settings</span>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </div>

            <button onClick={handleSignOut} className="btn-signout-danger">
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
    )

    return profileView === 'contacts' ? renderContactsSubView() : renderProfileMain()
}
