import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { TrustedZone } from '../types'
import { X, Plus, MapPin, Trash2 } from 'lucide-react'
import './TrustedZonesPage.css'

interface TrustedZonesPageProps {
  onClose: () => void
}

export default function TrustedZonesPage({ onClose }: TrustedZonesPageProps) {
  const { user } = useAuth()
  const [zones, setZones] = useState<TrustedZone[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    zone_name: '',
    latitude: '',
    longitude: '',
    radius_meters: '1000',
  })

  useEffect(() => {
    loadZones()
  }, [user?.id])

  const loadZones = async () => {
    if (!user?.id) return
    setIsLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('trusted_zones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setZones(data || [])
    } catch (err) {
      console.error('Error loading zones:', err)
      setError('Failed to load trusted zones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateZone = async () => {
    setError('')
    setSuccess('')

    if (!formData.zone_name.trim()) {
      setError('Zone name is required')
      return
    }

    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      setError('Location coordinates are required')
      return
    }

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Invalid coordinates')
      return
    }

    setIsSaving(true)

    try {
      if (!user?.id) return

      const { error: insertError } = await supabase
        .from('trusted_zones')
        .insert({
          user_id: user.id,
          zone_name: formData.zone_name,
          latitude: lat,
          longitude: lng,
          radius_meters: parseInt(formData.radius_meters) || 1000,
          is_active: true,
        })

      if (insertError) throw insertError

      setFormData({
        zone_name: '',
        latitude: '',
        longitude: '',
        radius_meters: '1000',
      })
      setShowForm(false)
      setSuccess('Trusted zone created successfully')
      await loadZones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create zone')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this trusted zone?')) return

    try {
      const { error: deleteError } = await supabase
        .from('trusted_zones')
        .delete()
        .eq('id', zoneId)

      if (deleteError) throw deleteError
      setSuccess('Trusted zone deleted')
      await loadZones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete zone')
    }
  }

  const handleToggleZone = async (zone: TrustedZone) => {
    try {
      const { error: updateError } = await supabase
        .from('trusted_zones')
        .update({ is_active: !zone.is_active })
        .eq('id', zone.id)

      if (updateError) throw updateError
      await loadZones()
    } catch (err) {
      console.error('Error toggling zone:', err)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
        setSuccess('Location updated from device GPS')
      })
    } else {
      setError('Geolocation is not supported by your browser')
    }
  }

  return (
    <div className="zones-modal-overlay" onClick={onClose}>
      <div className="zones-modal" onClick={(e) => e.stopPropagation()}>
        <div className="zones-modal-header">
          <h2>Trusted Zones</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <div className="zones-modal-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {!showForm ? (
            <>
              <button onClick={() => setShowForm(true)} className="btn-create-zone">
                <Plus size={18} />
                Add Trusted Zone
              </button>

              {isLoading ? (
                <div className="loading">Loading zones...</div>
              ) : zones.length === 0 ? (
                <div className="empty-state">
                  <MapPin size={48} />
                  <p>No trusted zones added yet</p>
                  <p className="empty-subtitle">
                    Add safe locations where you want reduced emergency alerts
                  </p>
                </div>
              ) : (
                <div className="zones-list">
                  {zones.map((zone) => (
                    <div key={zone.id} className="zone-card">
                      <div className="zone-header">
                        <div className="zone-info">
                          <h4>{zone.zone_name}</h4>
                          <p className="zone-coords">
                            {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="delete-button"
                          title="Delete zone"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="zone-details">
                        <span className="zone-radius">
                          Radius: {zone.radius_meters.toLocaleString()}m
                        </span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={zone.is_active}
                            onChange={() => handleToggleZone(zone)}
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-label">
                            {zone.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="zones-form">
              <h3>Add New Trusted Zone</h3>

              <div className="form-group">
                <label>Zone Name *</label>
                <input
                  type="text"
                  value={formData.zone_name}
                  onChange={(e) =>
                    setFormData({ ...formData, zone_name: e.target.value })
                  }
                  placeholder="e.g., Home, Office, School"
                  disabled={isSaving}
                />
              </div>

              <div className="location-section">
                <div className="form-group">
                  <label>Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="40.7128"
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group">
                  <label>Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="-74.0060"
                    disabled={isSaving}
                  />
                </div>

                <button
                  onClick={getCurrentLocation}
                  className="btn-gps"
                  type="button"
                  disabled={isSaving}
                >
                  <MapPin size={16} />
                  Use Current Location
                </button>
              </div>

              <div className="form-group">
                <label>Radius (meters)</label>
                <input
                  type="number"
                  value={formData.radius_meters}
                  onChange={(e) =>
                    setFormData({ ...formData, radius_meters: e.target.value })
                  }
                  placeholder="1000"
                  disabled={isSaving}
                />
                <small>Default safe zone radius around the location</small>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleCreateZone}
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Creating...' : 'Create Zone'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
