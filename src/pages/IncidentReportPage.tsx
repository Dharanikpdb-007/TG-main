import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { IncidentReport } from '../types'
import { X, Plus, AlertCircle, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './IncidentReportPage.css'

interface IncidentReportPageProps {
  onClose?: () => void
}

export default function IncidentReportPage({ onClose }: IncidentReportPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Determine if running as Standalone Page or Modal
  const isPageMode = !onClose;

  // Handle Close Action
  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1); // Go back if page mode
  }

  const [formData, setFormData] = useState({
    incident_type: 'harassment',
    severity: 'medium',
    description: '',
    witnesses: '',
    evidence_notes: '',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    loadIncidents()
  }, [user?.id])

  const loadIncidents = async () => {
    if (!user?.id) return
    setIsLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setIncidents(data || [])
    } catch (err) {
      console.error('Error loading incidents:', err)
      setError('Failed to load incidents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateIncident = async () => {
    if (!user?.id) return
    setError('')

    if (!formData.description.trim()) {
      setError('Description is required')
      return;
    }

    try {
      const witnesses = formData.witnesses
        .split(',')
        .map((w) => w.trim())
        .filter((w) => w)

      const { error: insertError } = await supabase
        .from('incident_reports')
        .insert({
          user_id: user.id,
          incident_type: formData.incident_type,
          severity: formData.severity,
          description: formData.description,
          witnesses: witnesses.length > 0 ? witnesses : null,
          evidence_notes: formData.evidence_notes || null,
          status: 'reported',
        })

      if (insertError) throw insertError

      setFormData({
        incident_type: 'harassment',
        severity: 'medium',
        description: '',
        witnesses: '',
        evidence_notes: '',
      })
      setShowForm(false)
      await loadIncidents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626'
      case 'high':
        return '#ea580c'
      case 'medium':
        return '#eab308'
      case 'low':
        return '#16a34a'
      default:
        return '#6b7280'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      reported: 'Reported',
      under_review: 'Under Review',
      investigating: 'Investigating',
      resolved: 'Resolved',
      closed: 'Closed',
    }
    return statusMap[status] || status
  }

  // Wrapper Class: If page mode, use full screen container, else modal overlay
  const containerClass = isPageMode ? 'incident-page-container' : 'incident-modal-overlay';
  const contentClass = isPageMode ? 'incident-page-content' : 'incident-modal';

  return (
    <div className={containerClass} onClick={!isPageMode ? handleClose : undefined}>
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        <div className="incident-modal-header">
          {isPageMode ? (
            <button onClick={handleClose} className="back-button" style={{ background: 'none', border: 'none', color: 'white', marginRight: 10 }}>
              <ChevronLeft size={24} />
            </button>
          ) : null}
          <h2>Incident Reports</h2>
          {!isPageMode && (
            <button onClick={handleClose} className="close-button">
              <X size={24} />
            </button>
          )}
        </div>

        <div className="incident-modal-content">
          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!showForm ? (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="btn-create-incident"
              >
                <Plus size={18} />
                Report New Incident
              </button>

              {isLoading ? (
                <div className="loading">Loading incidents...</div>
              ) : incidents.length === 0 ? (
                <div className="empty-state">
                  <p>No incidents reported yet</p>
                </div>
              ) : (
                <div className="incidents-list">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="incident-card"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className="incident-header">
                        <div className="incident-type">
                          <span
                            className="severity-badge"
                            style={{
                              backgroundColor: getSeverityColor(incident.severity),
                            }}
                          >
                            {incident.severity.toUpperCase()}
                          </span>
                          <h4>{incident.incident_type}</h4>
                        </div>
                        <span className="incident-status">
                          {getStatusBadge(incident.status)}
                        </span>
                      </div>

                      <p className="incident-description">{incident.description}</p>

                      <div className="incident-meta">
                        <span className="incident-date">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="incident-form">
              <h3>Report an Incident</h3>

              <div className="form-group">
                <label>Incident Type *</label>
                <select
                  value={formData.incident_type}
                  onChange={(e) =>
                    setFormData({ ...formData, incident_type: e.target.value })
                  }
                >
                  <option value="harassment">Harassment</option>
                  <option value="threats">Threats</option>
                  <option value="assault">Physical Assault</option>
                  <option value="theft">Theft</option>
                  <option value="accident">Accident</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Severity *</label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide detailed description of the incident"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Witnesses (comma-separated)</label>
                <input
                  type="text"
                  value={formData.witnesses}
                  onChange={(e) =>
                    setFormData({ ...formData, witnesses: e.target.value })
                  }
                  placeholder="John Doe, Jane Smith"
                />
              </div>

              <div className="form-group">
                <label>Evidence Notes</label>
                <textarea
                  value={formData.evidence_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, evidence_notes: e.target.value })
                  }
                  placeholder="Any evidence or additional details"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button onClick={handleCreateIncident} className="btn-primary">
                  Submit Report
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectedIncident && (
            <div className="incident-detail-overlay" onClick={() => setSelectedIncident(null)}>
              <div className="incident-detail" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="close-button"
                >
                  <X size={24} />
                </button>

                <h3>{selectedIncident.incident_type}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Severity</label>
                    <span
                      className="severity-badge"
                      style={{
                        backgroundColor: getSeverityColor(selectedIncident.severity),
                      }}
                    >
                      {selectedIncident.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="detail-item">
                    <label>Status</label>
                    <span className="status-text">
                      {getStatusBadge(selectedIncident.status)}
                    </span>
                  </div>

                  <div className="detail-item full-width">
                    <label>Description</label>
                    <p>{selectedIncident.description}</p>
                  </div>

                  {selectedIncident.witnesses && selectedIncident.witnesses.length > 0 && (
                    <div className="detail-item full-width">
                      <label>Witnesses</label>
                      <ul>
                        {selectedIncident.witnesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedIncident.evidence_notes && (
                    <div className="detail-item full-width">
                      <label>Evidence Notes</label>
                      <p>{selectedIncident.evidence_notes}</p>
                    </div>
                  )}

                  <div className="detail-item">
                    <label>Created</label>
                    <p>{new Date(selectedIncident.created_at).toLocaleString()}</p>
                  </div>

                  {selectedIncident.resolved_at && (
                    <div className="detail-item">
                      <label>Resolved</label>
                      <p>{new Date(selectedIncident.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
