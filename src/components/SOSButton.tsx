import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import './SOSButton.css'

interface SOSButtonProps {
  userId?: string
}

type EmergencyType = 'medical' | 'crime' | 'lost' | 'accident' | 'other'

export default function SOSButton({ userId }: SOSButtonProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { showNotification } = useNotification()
  const [isActivating, setIsActivating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    emergencyType: 'other' as EmergencyType,
    description: '',
  })

  // ... (rest of logic remains same)
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    }
  }

  const handleSubmitSOS = async () => {
    if (!userId) {
      setErrorMessage('User not authenticated')
      setStatus('error')
      return
    }

    setIsActivating(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const location = await new Promise<{ latitude: number; longitude: number }>(
        (resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
            },
            () => {
              resolve({ latitude: 0, longitude: 0 })
            }
          )
        }
      )

      const { data: sosEvent, error: sosError } = await supabase
        .from('sos_events')
        .insert({
          user_id: userId,
          emergency_type: formData.emergencyType,
          description: formData.description,
          latitude: location.latitude,
          longitude: location.longitude,
          device_info: getDeviceInfo(),
          status: 'triggered',
        })
        .select()
        .single()

      if (sosError) throw sosError

      try {
        const { data, error } = await supabase.functions.invoke('send-sos-email', {
          body: {
            sos_event_id: sosEvent.id,
            emergency_type: formData.emergencyType,
            description: formData.description,
          },
        })
        if (error) console.warn('Email service error:', error)
        else console.log('Email service response:', data)
      } catch (invokeError) {
        console.warn('Email service invocation failed:', invokeError)
      }

      showNotification('SOS Sent Successfully! Help is on the way.', 'success')
      setStatus('success')
      setFormData({ emergencyType: 'other', description: '' })
    } catch (error) {
      console.error('SOS activation error:', error)
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to send emergency alert'
      )
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="sos-button-container">
      {status === 'success' && (
        <div style={{
          background: '#1a1b1e',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CheckCircle size={32} color="#8b5cf6" />
          </div>
          <h3 style={{ marginBottom: 8 }}>Help is on the way</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: 24 }}>
            Your emergency has been reported. Stay calm and stay where you are if safe.
          </p>

          <button
            onClick={() => navigate('/sos-tracking')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: '#a78bfa',
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            Track Incident Status
          </button>

          <button
            onClick={() => setStatus('idle')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: '1px solid #333',
              background: 'transparent',
              color: 'white',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Report Another Emergency
          </button>

          {/* Emergency Numbers */}
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              📞 Emergency Numbers
            </h4>
            {[
              { name: 'National Emergency', number: '112', bg: '#7f1d1d' },
              { name: 'Police', number: '100', bg: '#3b1d1d' },
              { name: 'Ambulance', number: '108', bg: '#1d1d2e' },
            ].map(item => (
              <a key={item.number} href={`tel:${item.number}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: item.bg, borderRadius: 10, padding: '12px 16px',
                  marginBottom: 8, color: 'white', textDecoration: 'none',
                  fontWeight: 500
                }}>
                <span>{item.name}</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{item.number}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'idle' && (
        <>
          <h2 style={{ textAlign: 'center', color: '#e5e7eb', marginBottom: 24, fontSize: '1.2rem', fontWeight: 700 }}>
            {t('emergencyModeActive')}
          </h2>

          <div className="sos-form">
            <div className="form-header">
              <h3>{t('sendEmergencyAlert')}</h3>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="close-button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="emergency-type">{t('emergencyType')}</label>
              <select
                id="emergency-type"
                value={formData.emergencyType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emergencyType: e.target.value as EmergencyType,
                  }))
                }
                disabled={isActivating}
              >
                <option value="medical">Medical Emergency</option>
                <option value="crime">Crime / Assault</option>
                <option value="lost">Lost / Disoriented</option>
                <option value="accident">Accident</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('descriptionOptional')}</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the emergency situation..."
                disabled={isActivating}
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-cancel"
                disabled={isActivating}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitSOS}
                className="btn-send"
                disabled={isActivating}
              >
                {isActivating ? 'Sending...' : t('sendEmergencyAlert')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
