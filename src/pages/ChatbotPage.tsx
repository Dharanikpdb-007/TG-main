
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send, Bot, User, Sparkles } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import './ChatbotPage.css'

interface Message {
    id: string
    role: 'user' | 'model'
    text: string
    timestamp: Date
}

export default function ChatbotPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { showNotification } = useNotification()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: "Hello! I'm your Tourist Guard assistant. How can I help you stay safe today?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_API_KEY || '')


    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return
        if (!apiKey) {
            showNotification('API Key is missing. Please configure VITE_GOOGLE_API_KEY in .env', 'error')
            return
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            // Call Gemini API
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: `You are a helpful assistant for the Tourist Guard app. You help tourists stay safe, find emergency contacts, and navigate the app. Answer helpful and concise. User: ${input}` }]
                        }
                    ]
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to fetch response')
            }

            const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't understand that."

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: modelResponse,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, botMsg])
        } catch (error: any) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: `Error: ${error.message}. Please check your API key.`,
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="chatbot-page">
            <header className="chatbot-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={24} />
                </button>
                <div className="header-title">
                    <Bot size={24} className="header-icon" />
                    <h2>{t('smartChatbot') || 'SafeTravel AI'}</h2>
                </div>
            </header>



            <div className="chat-container">
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                        <div className="bubble-icon">
                            {msg.role === 'model' ? <Sparkles size={16} /> : <User size={16} />}
                        </div>
                        <div className="bubble-content">
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-bubble model loading">
                        <div className="bubble-icon"><Bot size={16} /></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about safety, emergency contacts..."
                    className="chat-input"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    className="chat-send-btn"
                    disabled={!input.trim() || isLoading}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    )
}
