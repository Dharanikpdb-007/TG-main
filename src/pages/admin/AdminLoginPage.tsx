import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock } from 'lucide-react'
import './Admin.css'

export default function AdminLoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('admin_auth', 'true')
            navigate('/admin/dashboard')
        } else {
            setError('Invalid credentials')
        }
    }

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-logo">
                    <Shield size={48} color="#8b5cf6" />
                    <h1>Tour Guard Admin</h1>
                </div>

                {error && <div className="admin-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter admin username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                        />
                    </div>

                    <button type="submit" className="btn-admin-login">
                        <Lock size={18} /> Login to Dashboard
                    </button>
                </form>
            </div>
        </div>
    )
}
