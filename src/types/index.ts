export type User = {
  id: string
  email: string
  name: string
  phone?: string
  digital_id: string
  email_verified: boolean
  phone_verified: boolean
  profile_picture?: string
  emergency_mode_active: boolean
  current_latitude?: number
  current_longitude?: number
  last_location_update?: string
  created_at: string
}

export type EmergencyContact = {
  id: string
  user_id: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  relationship: string
  created_at: string
}

export type SOSEvent = {
  id: string
  user_id: string
  emergency_type: string
  description?: string
  latitude?: number
  longitude?: number
  device_info?: Record<string, unknown>
  audio_url?: string
  photo_urls?: string[]
  status: 'triggered' | 'acknowledged' | 'resolved'
  triggered_at: string
  resolved_at?: string
  created_at: string
}

export type EmailLog = {
  id: string
  sos_event_id: string
  recipient_email: string
  recipient_name?: string
  status: 'sent' | 'failed' | 'pending'
  error_message?: string
  retry_count: number
  sent_at?: string
  created_at: string
}

export type IncidentReport = {
  id: string
  user_id: string
  sos_event_id?: string
  incident_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location_latitude?: number
  location_longitude?: number
  witnesses?: string[]
  photo_urls?: string[]
  evidence_notes?: string
  status: string
  assigned_to?: string
  resolution_notes?: string
  created_at: string
  resolved_at?: string
}

export type TrustedZone = {
  id: string
  user_id: string
  zone_name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

export type ActivityLog = {
  id: string
  user_id: string
  action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export type AppSettings = {
  id: string
  user_id: string
  emergency_auto_alert: boolean
  location_tracking_enabled: boolean
  share_location_with_contacts: boolean
  sos_sound_enabled: boolean
  sos_vibration_enabled: boolean
  emergency_mode_timeout_minutes: number
  preferred_contact_id?: string
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export type AuthState = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
