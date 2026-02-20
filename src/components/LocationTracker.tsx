import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNotification } from '../contexts/NotificationContext'

interface LocationTrackerProps {
  userId?: string
}

export default function LocationTracker({ userId }: LocationTrackerProps) {
  // Logic Only Component - No UI
  const { showNotification } = useNotification()
  const [internalUserId, setInternalUserId] = useState<string | undefined>(userId)

  useEffect(() => {
    if (userId) {
      setInternalUserId(userId)
    } else {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setInternalUserId(data.user.id)
      })
    }
  }, [userId])

  useEffect(() => {
    if (!internalUserId) return

    // Auto-start tracking if permission exists
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const timestamp = new Date().toISOString()
        const now = Date.now()

        // --- AI SAFETY LOGIC ---
        // Check if AI SOS is enabled by user
        const isAiEnabled = localStorage.getItem('ai_sos_enabled') === 'true'

        // Load granular feature flags
        const featureConfigStr = localStorage.getItem('ai_features_config')
        const featureConfig = featureConfigStr ? JSON.parse(featureConfigStr) : {
          behavioral: true,
          voice: true,
          crowd: true,
          context: true,
          predictive: true
        }

        if (isAiEnabled) {
          // 1. Static Location Check (Behavioral Anomaly)
          if (featureConfig.behavioral) {
            const lastLat = parseFloat(localStorage.getItem('ai_last_lat') || '0')
            const lastLon = parseFloat(localStorage.getItem('ai_last_lon') || '0')
            const lastMoveTs = parseInt(localStorage.getItem('ai_last_move_ts') || Date.now().toString())

            const distMoved = getDistanceFromLatLonInKm(latitude, longitude, lastLat, lastLon)

            // Threshold: 100 meters movement to be considered "moving"
            if (distMoved > 0.1 || lastLat === 0) {
              localStorage.setItem('ai_last_lat', latitude.toString())
              localStorage.setItem('ai_last_lon', longitude.toString())
              localStorage.setItem('ai_last_move_ts', now.toString())
            } else {
              // Not moved significantly
              const timeStatic = now - lastMoveTs
              // CHANGED FOR DEMO: 5 Minutes (was 24 hours)
              const STATIC_THRESHOLD_MS = 5 * 60 * 1000

              if (timeStatic > STATIC_THRESHOLD_MS) {
                // Check if we already triggered recently to avoid spam
                const lastTrigger = parseInt(localStorage.getItem('ai_sos_trigger_static_ts') || '0')
                if (now - lastTrigger > 60 * 1000) { // 1 minute cooldown (was 1 hour)
                  console.warn('AI ALERT: User static for > 5min. Triggering SOS.')
                  await triggerSOS('other', 'User location unchanged for 5 minutes. Potential stuck/injured.', latitude, longitude)
                  localStorage.setItem('ai_sos_trigger_static_ts', now.toString())
                }
              }
            }
          }

          // 2. Red Zone Check (Context-Aware)
          if (featureConfig.context) {
            // Fetch dangerous incidents nearby (mock or real)
            // For efficiency, we only check this every few minutes or use cached zones
            // Here we simulate a check against "High Scrutiny Areas"

            // Mock Red Zone check: In a real app, fetch from DB
            const inRedZone = await checkIfInRedZone(latitude, longitude)

            if (inRedZone) {
              const entryTs = parseInt(localStorage.getItem('ai_red_zone_entry_ts') || '0')
              if (entryTs === 0) {
                // Just entered
                localStorage.setItem('ai_red_zone_entry_ts', now.toString())
              } else {
                const timeInZone = now - entryTs
                // CHANGED FOR DEMO: 2 Minutes (was 2 hours)
                const ZONE_THRESHOLD_MS = 2 * 60 * 1000

                if (timeInZone > ZONE_THRESHOLD_MS) {
                  const lastTrigger = parseInt(localStorage.getItem('ai_sos_trigger_zone_ts') || '0')
                  if (now - lastTrigger > 60 * 1000) { // 1 minute cooldown
                    console.warn('AI ALERT: User in Red Zone > 2min. Triggering SOS.')
                    await triggerSOS('other', 'User in high-risk zone for over 2 minutes.', latitude, longitude)
                    localStorage.setItem('ai_sos_trigger_zone_ts', now.toString())
                  }
                }
              }
            } else {
              // Left red zone
              localStorage.setItem('ai_red_zone_entry_ts', '0')
            }
          }

          // 3. Other Placeholder Checks
          if (featureConfig.predictive) {
            // Future Implementation: Predictive analysis based on trajectory
          }
        }
        // --- END AI LOGIC ---

        // --- END AI LOGIC ---

        try {
          await supabase
            .from('users')
            .update({
              current_latitude: latitude,
              current_longitude: longitude,
              last_location_update: timestamp,
            })
            .eq('id', internalUserId)
        } catch (err) {
          console.error('Error updating location:', err)
        }
      },
      (err) => {
        console.error('Location tracker error:', err)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [internalUserId])

  const triggerSOS = async (type: string, description: string, lat: number, lon: number) => {
    if (!internalUserId) return
    try {
      // 1. Create SOS Event
      const { data: sosEvent, error: insertError } = await supabase
        .from('sos_events')
        .insert({
          user_id: internalUserId,
          emergency_type: type,
          description: description,
          latitude: lat,
          longitude: lon,
          status: 'triggered',
          triggered_at: new Date().toISOString(),
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            source: 'AI_LOCATION_TRACKER'
          }
        })
        .select() // Important to get the ID back
        .single()

      if (insertError) throw insertError

      showNotification(`AI Safety Trigger: ${description}`, 'warning', 10000)

      // 2. Invoke Edge Function (Email/Notifications)
      const { error: fnError } = await supabase.functions.invoke('send-sos-email', {
        body: {
          sos_event_id: sosEvent.id,
          emergency_type: type,
          description: description,
        },
      })

      if (fnError) console.error('Failed to invoke SOS edge function:', fnError)

    } catch (e) {
      console.error('Failed to trigger AI SOS:', e)
    }
  }

  // Helper: Haversine Distance
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
  }

  // Helper: Check Red Zone (Simulated for Demo based on dangerous incidents nearby)
  async function checkIfInRedZone(lat: number, lon: number): Promise<boolean> {
    // In a real app, query 'danger_zones' table or 'incidents' with severity='critical'
    // We'll check if there's any 'critical' incident within 500m
    try {
      const { data } = await supabase
        .from('incident_reports')
        .select('location_latitude, location_longitude')
        .eq('severity', 'critical')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // recent critical incidents

      if (!data) return false

      return data.some((incident) => {
        if (incident.location_latitude && incident.location_longitude) {
          const dist = getDistanceFromLatLonInKm(lat, lon, incident.location_latitude, incident.location_longitude)
          return dist < 0.5 // 500m radius
        }
        return false
      })
    } catch (e) {
      return false
    }
  }

  return null // Render nothing explicitly
}
