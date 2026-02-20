import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  User, Mail, Phone, Globe, Calendar, FileText, Upload,
  Heart, AlertCircle, Lock, Check, ChevronRight, ChevronLeft, ArrowRight
} from 'lucide-react'
import './RegisterWizard.css'

interface RegisterPageProps {
  onSwitchToLogin?: () => void
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { signUp } = useAuth()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  // File Upload Refs
  const passportInputRef = useRef<HTMLInputElement>(null)
  const visaInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    entryDate: '',
    exitDate: '',

    // Step 2: Documents
    passportPhoto: null as File | null,
    visaDoc: null as File | null,

    // Step 3: Emergency & Medical
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    emergencyEmail: '',
    bloodType: '',
    allergies: '',
    medicalConditions: '',

    // Step 4: Password
    password: '',
    confirmPassword: '',

    // Step 5: Terms
    termsAccepted: false
  })

  // Navigation Logic
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5))
      setError('')
    }
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.nationality) {
        setError('Please fill in all required personal fields')
        return false
      }
    }
    if (currentStep === 3) {
      if (!formData.emergencyName || !formData.emergencyPhone) {
        setError('Primary emergency contact name and phone are required')
        return false
      }
    }
    if (currentStep === 4) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'passportPhoto' | 'visaDoc') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData(prev => ({ ...prev, [field]: file }))
    }
  }

  const handleRegister = async () => {
    if (!formData.termsAccepted) {
      setError('You must accept the terms and conditions')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 1. Sign Up (Creates User + initial Profile via Context)
      await signUp(formData.email, formData.password, formData.fullName, formData.phone)

      // 2. Get the new user ID
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Registration failed to retrieve user')

      const userId = user.id

      // 3. Update User Profile with extra details (Passport, Medical, etc.)
      const { error: profileError } = await supabase
        .from('users')
        .update({
          nationality: formData.nationality,
          passport_number: formData.passportNumber,
          entry_date: formData.entryDate || null,
          exit_date: formData.exitDate || null,
          blood_type: formData.bloodType,
          allergies: formData.allergies,
          medical_conditions: formData.medicalConditions,
          passport_photo_url: formData.passportPhoto ? 'pending_upload_passport' : null,
          visa_doc_url: formData.visaDoc ? 'pending_upload_visa' : null
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      // 4. Create Emergency Contact
      const { error: contactError } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: userId,
          name: formData.emergencyName,
          relationship: formData.emergencyRelation || 'Family',
          phone_number: formData.emergencyPhone,
          email: formData.emergencyEmail,
          is_primary: true
        })

      if (contactError) console.error('Contact creation error:', contactError)

      // 5. Success!
      setShowSuccess(true)

    } catch (err: any) {
      console.error('Registration Error:', err)
      setError(err.message || 'Failed to register. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Render Steps ---

  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="step-header">
        <span className="step-indicator">Step 1 of 5</span>
        <h2>Personal Information</h2>
        <p>Enter your basic details for tourist registration</p>
      </div>

      <div className="form-group">
        <label>Full Name (as on passport)</label>
        <div className="input-wrapper">
          <User size={18} className="input-icon" />
          <input className="form-input" placeholder="John Smith"
            value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input className="form-input" type="email" placeholder="you@example.com"
              value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <div className="input-wrapper">
            <Phone size={18} className="input-icon" />
            <input className="form-input" placeholder="+1 234 567 8900"
              value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Nationality</label>
          <div className="input-wrapper">
            <Globe size={18} className="input-icon" />
            <input className="form-input" placeholder="United States"
              value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Passport Number</label>
          <div className="input-wrapper">
            <FileText size={18} className="input-icon" />
            <input className="form-input" placeholder="AB1234567"
              value={formData.passportNumber} onChange={e => setFormData({ ...formData, passportNumber: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Entry Date to India</label>
          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input className="form-input" type="date"
              value={formData.entryDate} onChange={e => setFormData({ ...formData, entryDate: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Expected Exit Date</label>
          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input className="form-input" type="date"
              value={formData.exitDate} onChange={e => setFormData({ ...formData, exitDate: e.target.value })} />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="step-header">
        <span className="step-indicator">Step 2 of 5</span>
        <h2>Document Upload</h2>
        <p>Upload your travel documents for verification (optional for demo)</p>
      </div>

      <div className="form-group">
        <label>Passport Photo Page</label>
        <input
          type="file"
          ref={passportInputRef}
          onChange={(e) => handleFileChange(e, 'passportPhoto')}
          style={{ display: 'none' }}
          accept="image/*,.pdf"
        />
        <div className="upload-area" onClick={() => passportInputRef.current?.click()}>
          <Upload size={32} className="upload-icon" color={formData.passportPhoto ? '#10b981' : '#9ca3af'} />
          <span className="upload-text">
            {formData.passportPhoto ? (formData.passportPhoto).name : 'Click to upload'}
          </span>
          <span className="upload-subtext">
            {formData.passportPhoto ? 'File selected' : 'JPG, PNG, WebP or PDF (max 5MB)'}
          </span>
        </div>
      </div>

      <div className="form-group">
        <label>Visa Document (if applicable)</label>
        <input
          type="file"
          ref={visaInputRef}
          onChange={(e) => handleFileChange(e, 'visaDoc')}
          style={{ display: 'none' }}
          accept="image/*,.pdf"
        />
        <div className="upload-area" onClick={() => visaInputRef.current?.click()}>
          <Upload size={32} className="upload-icon" color={formData.visaDoc ? '#10b981' : '#9ca3af'} />
          <span className="upload-text">
            {formData.visaDoc ? (formData.visaDoc).name : 'Click to upload'}
          </span>
          <span className="upload-subtext">
            {formData.visaDoc ? 'File selected' : 'JPG, PNG, WebP or PDF (max 5MB)'}
          </span>
        </div>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="step-header">
        <span className="step-indicator">Step 3 of 5</span>
        <h2>Emergency Contacts & Medical</h2>
        <p>Provide emergency contact details for your safety</p>
      </div>

      <div className="form-group full-width" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Phone size={18} /> Primary Emergency Contact
        </h3>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Contact Name</label>
          <div className="input-wrapper">
            <input className="form-input no-icon" placeholder="Jane Smith"
              value={formData.emergencyName} onChange={e => setFormData({ ...formData, emergencyName: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Relationship</label>
          <select className="form-select" style={{ padding: 12, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #2a2b30', width: '100%' }}
            value={formData.emergencyRelation} onChange={e => setFormData({ ...formData, emergencyRelation: e.target.value })}>
            <option value="">Select relationship</option>
            <option value="Parent">Parent</option>
            <option value="Spouse">Spouse</option>
            <option value="Sibling">Sibling</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Phone Number</label>
          <div className="input-wrapper">
            <input className="form-input no-icon" placeholder="+1 234..."
              value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Email (Optional)</label>
          <div className="input-wrapper">
            <input className="form-input no-icon" placeholder="jane@example.com"
              value={formData.emergencyEmail} onChange={e => setFormData({ ...formData, emergencyEmail: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="form-group full-width" style={{ marginTop: 30 }}>
        <h3 style={{ fontSize: '1rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={18} /> Medical Information (Optional)
        </h3>
      </div>

      <div className="form-group">
        <label>Blood Type</label>
        <select className="form-select" style={{ padding: 12, borderRadius: 8, background: '#0f1013', color: 'white', border: '1px solid #2a2b30', width: '100%' }}
          value={formData.bloodType} onChange={e => setFormData({ ...formData, bloodType: e.target.value })}>
          <option value="">Select blood type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
        </select>
      </div>

      <div className="form-group">
        <label>Known Allergies</label>
        <div className="input-wrapper">
          <input className="form-input no-icon" placeholder="List any allergies..."
            value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label>Medical Conditions</label>
        <div className="input-wrapper">
          <input className="form-input no-icon" placeholder="List any conditions (diabetes, etc)..."
            value={formData.medicalConditions} onChange={e => setFormData({ ...formData, medicalConditions: e.target.value })} />
        </div>
      </div>
    </motion.div>
  )

  const renderStep4 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="step-header">
        <span className="step-indicator">Step 4 of 5</span>
        <h2>Create Password</h2>
        <p>Set a secure password for your Tour Guard account</p>
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="input-wrapper">
          <Lock size={18} className="input-icon" />
          <input className="form-input" type="password" placeholder="••••••••"
            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <div className="input-wrapper">
          <Lock size={18} className="input-icon" />
          <input className="form-input" type="password" placeholder="••••••••"
            value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8, fontSize: '0.9rem', color: '#9ca3af' }}>
        <p style={{ marginBottom: 8, color: 'white', fontWeight: 600 }}>Password requirements:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>At least 6 characters</li>
        </ul>
      </div>
    </motion.div>
  )

  const renderStep5 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="step-header">
        <span className="step-indicator">Step 5 of 5</span>
        <h2>Terms & Conditions</h2>
        <p>Please review and accept our terms</p>
      </div>

      <div style={{ height: 200, overflowY: 'auto', background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8, marginBottom: 20, fontSize: '0.9rem', color: '#d1d5db' }}>
        <p><strong>1. Acceptance of Terms</strong><br />By creating an account, you agree to our terms of service...</p>
        <br />
        <p><strong>2. Privacy Policy</strong><br />We respect your privacy and protect your personal data...</p>
        <br />
        <p><strong>3. Emergency Services</strong><br />Tour Guard acts as a facilitator for emergency alerts...</p>
      </div>

      <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" style={{ width: 18, height: 18 }}
          checked={formData.termsAccepted} onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })} />
        <span>I agree to the Terms of Service and Privacy Policy</span>
      </label>
    </motion.div>
  )

  return (
    <div className="register-container">
      <div className="stepper-wrapper">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`step-item ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`}>
            <div className="step-circle">
              {step > i ? <Check size={16} /> : i}
            </div>
            <span className="step-label">
              {i === 1 ? 'Personal' : i === 2 ? 'Docs' : i === 3 ? 'Emergency' : i === 4 ? 'Password' : 'Terms'}
            </span>
          </div>
        ))}
      </div>

      <div className="wizard-card">
        {error && <div className="error-message" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>}

        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </AnimatePresence>

        <div className="wizard-actions">
          {step > 1 ? (
            <button className="btn-wizard btn-back" onClick={prevStep}>
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <div /> // Spacer
          )}

          {step < 5 ? (
            <button className="btn-wizard btn-next" onClick={nextStep} style={{ width: step === 5 ? '100%' : 'auto' }}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn-wizard btn-next" onClick={handleRegister} disabled={isLoading} style={{ background: '#8b5cf6' }}>
              {isLoading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="login-link">
        Already registered? <a href="#" onClick={(e) => { e.preventDefault(); if (onSwitchToLogin) onSwitchToLogin(); else window.location.href = '/login'; }}>Sign In here</a>
      </div>

      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <Check size={48} color="white" />
            </div>
            <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 10 }}>Registration Successful!</h3>
            <p style={{ color: '#9ca3af', marginBottom: 30 }}>Your account has been created successfully. Welcome to Tour Guard.</p>
            <button className="btn-wizard btn-next" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { if (onSwitchToLogin) onSwitchToLogin(); else window.location.href = '/login'; }}>
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
