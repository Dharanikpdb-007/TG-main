import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Send, Users, ChevronLeft, MessageSquare } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'
import { useLanguage } from '../contexts/LanguageContext'
import './CommunityPage.css'

interface CommunityMessage {
    id: string
    user_id: string
    content: string
    created_at: string
    user_name: string
    avatar_url?: string
}

export default function CommunityPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { showNotification } = useNotification()
    const [messages, setMessages] = useState<CommunityMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel('public:community_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
                const newMsg = payload.new as CommunityMessage
                setMessages((prev) => [...prev, newMsg])
                scrollToBottom()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('community_messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50)

            if (error) throw error
            if (data) {
                setMessages(data)
                scrollToBottom()
            }
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user) return

        const content = newMessage.trim()
        setNewMessage('') // Optimistic clear

        try {
            // Get user profile for name
            const { data: profile } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single()

            const userName = profile?.name || user.email?.split('@')[0] || 'Anonymous'

            const { error } = await supabase
                .from('community_messages')
                .insert({
                    user_id: user.id,
                    content: content,
                    user_name: userName,
                    created_at: new Date().toISOString()
                })

            if (error) throw error
        } catch (error) {
            console.error('Error sending message:', error)
            showNotification('Failed to send message. Please try again.', 'error')
            setNewMessage(content) // Restore on error
        }
    }

    return (
        <div className="community-page">
            <header className="community-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={24} />
                </button>
                <div className="header-title">
                    <Users size={20} className="header-icon" />
                    <h2>{t('communityChat') || 'Community Chat'}</h2>
                </div>
            </header>

            <div className="messages-container">
                {loading ? (
                    <div className="loading-state">
                        <MessageSquare size={48} className="pulse-icon" />
                        <p>Loading conversation...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={48} />
                        <h3>No messages yet</h3>
                        <p>Be the first to say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.user_id === user?.id
                        return (
                            <div key={msg.id} className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                                {!isOwn && <span className="message-author">{msg.user_name}</span>}
                                <div className="message-content">
                                    {msg.content}
                                </div>
                                <span className="message-time">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )
                    })
                )}
                <div ref={scrollRef} />
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    )
}
