import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { EmergencyContact } from '../types'
import { Trash2, Mail, Phone } from 'lucide-react'
import './EmergencyContactsList.css'

interface EmergencyContactsListProps {
  contacts: EmergencyContact[]
  onContactDeleted: () => void
}

export default function EmergencyContactsList({
  contacts,
  onContactDeleted,
}: EmergencyContactsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleDelete = async (contactId: string) => {
    setDeletingId(contactId)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId)

      if (deleteError) throw deleteError

      onContactDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="contacts-list">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      {contacts.map((contact) => (
        <div key={contact.id} className="contact-card">
          <div className="contact-header">
            <h4>{contact.contact_name}</h4>
            <span className="relationship-badge">{contact.relationship}</span>
          </div>

          <div className="contact-details">
            {contact.contact_email && (
              <div className="contact-row">
                <Mail size={16} />
                <a href={`mailto:${contact.contact_email}`}>{contact.contact_email}</a>
              </div>
            )}

            {contact.contact_phone && (
              <div className="contact-row">
                <Phone size={16} />
                <a href={`tel:${contact.contact_phone}`}>{contact.contact_phone}</a>
              </div>
            )}
          </div>

          <button
            onClick={() => handleDelete(contact.id)}
            disabled={deletingId === contact.id}
            className="btn-delete"
            title="Delete contact"
          >
            <Trash2 size={16} />
            {deletingId === contact.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  )
}
