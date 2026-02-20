import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle } from 'lucide-react'
import './AddContactForm.css'

interface AddContactFormProps {
  userId?: string
  onContactAdded: () => void
  onCancel: () => void
}

type Relationship = 'family' | 'friend' | 'embassy' | 'other'

export default function AddContactForm({
  userId,
  onContactAdded,
  onCancel,
}: AddContactFormProps) {
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    relationship: 'family' as Relationship,
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.contactName || !formData.contactEmail) {
      setError('Name and email are required')
      return
    }

    if (!userId) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: userId,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone || null,
          relationship: formData.relationship,
        })

      if (insertError) throw insertError

      onContactAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-contact-form">
      {error && (
        <div className="form-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="contactName">Contact Name *</label>
        <input
          id="contactName"
          type="text"
          name="contactName"
          value={formData.contactName}
          onChange={handleChange}
          placeholder="Full name"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="contactEmail">Email Address *</label>
        <input
          id="contactEmail"
          type="email"
          name="contactEmail"
          value={formData.contactEmail}
          onChange={handleChange}
          placeholder="email@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="contactPhone">Phone Number</label>
        <input
          id="contactPhone"
          type="tel"
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          placeholder="+1 (555) 000-0000"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="relationship">Relationship</label>
        <select
          id="relationship"
          name="relationship"
          value={formData.relationship}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="family">Family Member</option>
          <option value="friend">Friend</option>
          <option value="embassy">Embassy / Consulate</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Contact'}
        </button>
      </div>
    </form>
  )
}
