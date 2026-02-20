import { Shield, ArrowRight } from 'lucide-react'
import './LandingPage.css'

interface LandingPageProps {
    onGetStarted: () => void
    onLogin: () => void
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
    return (
        <div className="landing-container">
            <div className="landing-content">
                <div className="trust-badge">
                    <Shield size={16} className="badge-icon" />
                    <span>Trusted by 50,000+ Tourists</span>
                </div>

                <h1 className="landing-title">
                    Travel India<br />
                    <span className="gradient-text">With Confidence</span>
                </h1>

                <p className="landing-subtitle">
                    Your AI-powered safety companion for exploring India. Real-time
                    protection, instant emergency response, and blockchain-verified
                    security—all in one app.
                </p>

                <div className="landing-actions">
                    <button onClick={onGetStarted} className="btn-get-started">
                        Register
                        <ArrowRight size={20} />
                    </button>

                    <button onClick={onLogin} className="btn-already-registered">
                        Login
                    </button>
                </div>
            </div>
        </div>
    )
}
