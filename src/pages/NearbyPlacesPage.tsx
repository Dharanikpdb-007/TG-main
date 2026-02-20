import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, MapPin, Navigation, Info, ExternalLink, Loader2, RefreshCw, X, Share2, Compass, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './NearbyPlacesPage.css'

// Fix for default Leaflet icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [24, 41],
    iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface TouristPlace {
    id: number
    name: string
    type: string
    lat: number
    lon: number
    distance?: number // in km
}

export default function NearbyPlacesPage() {
    const navigate = useNavigate()
    const [places, setPlaces] = useState<TouristPlace[]>([])
    const [loading, setLoading] = useState(true)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [error, setError] = useState('')
    const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null)

    // Mobile view state
    const [showMobileDetail, setShowMobileDetail] = useState(false)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setUserLocation({ lat: latitude, lng: longitude })
                    fetchNearbyPlaces(latitude, longitude)
                },
                (err) => {
                    console.error('Error getting location:', err)
                    setError('Unable to access your location. Please enable location services.')
                    setLoading(false)
                }
            )
        } else {
            setError('Geolocation is not supported by your browser.')
            setLoading(false)
        }
    }, [])

    const fetchNearbyPlaces = async (lat: number, lon: number) => {
        try {
            setLoading(true)
            setError('')

            // Overpass API query - 3000m radius
            const query = `
                [out:json][timeout:90];
                (
                  nwr["tourism"](around:3000,${lat},${lon});
                  nwr["amenity"="place_of_worship"](around:3000,${lat},${lon});
                  nwr["historic"](around:3000,${lat},${lon});
                  nwr["natural"="beach"](around:3000,${lat},${lon});
                  nwr["leisure"="park"](around:3000,${lat},${lon});
                  nwr["leisure"="garden"](around:3000,${lat},${lon});
                );
                out center;
            `
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

            const response = await fetch(url)

            if (!response.ok) throw new Error(`Overpass API Error: ${response.statusText}`)

            const data = await response.json()
            if (!data.elements) throw new Error('Invalid data format received from API')

            const elements = data.elements.map((el: any) => {
                const placeLat = el.lat || el.center?.lat || 0
                const placeLon = el.lon || el.center?.lon || 0
                const tags = el.tags || {}

                // Determine type
                let type = 'Attraction'
                if (tags.amenity === 'place_of_worship') {
                    type = tags.religion ? `${tags.religion} Temple/Place` : 'Place of Worship'
                } else if (tags.natural === 'beach') {
                    type = 'Beach'
                } else if (tags.historic) {
                    type = tags.historic === 'yes' ? 'Historic Site' : tags.historic
                } else if (tags.leisure === 'park' || tags.leisure === 'garden') {
                    type = tags.leisure
                } else if (tags.tourism) {
                    type = tags.tourism
                }

                // Format Type string
                if (typeof type === 'string') {
                    type = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                }

                return {
                    id: el.id,
                    name: tags.name,
                    type: type,
                    lat: placeLat,
                    lon: placeLon,
                    distance: calculateDistance(lat, lon, placeLat, placeLon)
                }
            }).filter((place: any) => place.name && place.lat !== 0)

            // Sort by distance
            elements.sort((a: TouristPlace, b: TouristPlace) => (a.distance || 0) - (b.distance || 0))

            setPlaces(elements)
            // Select first place by default on desktop if available
            if (window.innerWidth > 768 && elements.length > 0) {
                setSelectedPlace(elements[0])
            }
        } catch (err: any) {
            console.error('Error fetching places:', err)
            setError(`Failed to fetch nearby places: ${err.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371
        const dLat = (lat2 - lat1) * (Math.PI / 180)
        const dLon = (lon2 - lon1) * (Math.PI / 180)
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const openInMaps = (lat: number, lon: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')
    }

    const handlePlaceClick = (place: TouristPlace) => {
        setSelectedPlace(place)
        setShowMobileDetail(true)
    }

    // Generate descriptive text
    const getPlaceDescription = (place: TouristPlace) => {
        const typeLower = place.type.toLowerCase()
        let desc = `A popular ${typeLower} located approximately ${place.distance?.toFixed(2)}km from your current location.`

        if (typeLower.includes('temple') || typeLower.includes('worship')) {
            desc += " This site is significant for local culture and spirituality. Visitors are advised to dress modestly."
        } else if (typeLower.includes('beach')) {
            desc += " perfect for relaxation and enjoying the coastal scenery. Check local safety flags before swimming."
        } else if (typeLower.includes('museum') || typeLower.includes('historic')) {
            desc += " A great location to explore the history and heritage of the region."
        } else if (typeLower.includes('park') || typeLower.includes('garden')) {
            desc += " An excellent spot for a walk, picnic, or enjoying nature."
        } else {
            desc += " A recommended stop for tourists exploring the area."
        }
        return desc
    }

    // Get background gradient based on type
    const getHeroGradient = (type: string) => {
        const t = type.toLowerCase()
        if (t.includes('temple') || t.includes('worship')) return 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' // Amber
        if (t.includes('beach') || t.includes('water')) return 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' // Sky
        if (t.includes('park') || t.includes('garden') || t.includes('nature')) return 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)' // Green
        if (t.includes('historic') || t.includes('museum')) return 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' // Purple
        return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' // Default Dark
    }

    const getPlaceImage = (type: string) => {
        const t = type.toLowerCase()

        // Religious
        if (t.includes('hindu') || t.includes('shiva') || t.includes('vishnu')) return 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('church') || t.includes('cathedral') || t.includes('christian')) return 'https://images.unsplash.com/photo-1548625361-988950fb2dc0?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('mosque') || t.includes('muslim') || t.includes('islam')) return 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('buddhist') || t.includes('pagoda')) return 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('temple') || t.includes('worship')) return 'https://images.unsplash.com/photo-1582510003544-4d00b7f5feee?auto=format&fit=crop&q=80&w=1000'

        // Nature
        if (t.includes('beach') || t.includes('coast') || t.includes('sea')) return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('park') || t.includes('garden') || t.includes('botanic')) return 'https://images.unsplash.com/photo-1496347646636-ea47f7d6b37b?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('mountain') || t.includes('hill') || t.includes('peak')) return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('river') || t.includes('lake') || t.includes('waterfall')) return 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=1000'

        // Culture & History
        if (t.includes('museum') || t.includes('gallery')) return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('historic') || t.includes('monument') || t.includes('fort') || t.includes('castle') || t.includes('ruins')) return 'https://images.unsplash.com/photo-1565060169683-10a996da978c?auto=format&fit=crop&q=80&w=1000'

        // Urban / Hospitality
        if (t.includes('hotel') || t.includes('resort') || t.includes('stay')) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('restaurant') || t.includes('cafe') || t.includes('dining')) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('market') || t.includes('shopping') || t.includes('mall')) return 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1000'
        if (t.includes('view') || t.includes('lookout')) return 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=1000'

        // Default
        return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000' // Generic Landscape
    }

    return (
        <div className={`nearby-places-page ${showMobileDetail ? 'show-details' : ''}`}>

            {/* Sidebar - List View */}
            <div className="np-sidebar">
                <div className="np-header">
                    <button onClick={() => navigate(-1)} className="np-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2>Nearby Places</h2>
                </div>

                <div className="np-list-container">
                    {loading ? (
                        <div className="np-loading">
                            <Loader2 className="np-spinner" size={32} />
                            <p>Discovering places...</p>
                        </div>
                    ) : error ? (
                        <div className="np-error">
                            <Info size={32} />
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    marginTop: 16,
                                    padding: '8px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <RefreshCw size={16} style={{ marginRight: 8 }} /> Retry
                            </button>
                        </div>
                    ) : places.length === 0 ? (
                        <div className="np-empty">
                            <MapPin size={32} />
                            <p>No places found within 3km.</p>
                        </div>
                    ) : (
                        <div className="np-list">
                            {places.map((place) => (
                                <div
                                    key={place.id}
                                    className={`np-card ${selectedPlace?.id === place.id ? 'active' : ''}`}
                                    onClick={() => handlePlaceClick(place)}
                                >
                                    <div className="np-card-icon">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="np-card-info">
                                        <h3>{place.name}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="np-type">{place.type}</span>
                                            <span className="np-distance">{place.distance?.toFixed(2)} km</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content - Detail View */}
            <div className="np-main">
                {selectedPlace ? (
                    <>
                        <button className="close-detail-mobile" onClick={() => setShowMobileDetail(false)}>
                            <X size={24} />
                        </button>

                        {/* Hero Section */}
                        <div className="detail-hero" style={{
                            backgroundImage: `linear-gradient(to bottom, transparent 0%, rgba(15, 23, 42, 0.9) 100%), url(${getPlaceImage(selectedPlace.type)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            {!getPlaceImage(selectedPlace.type) && <Compass className="detail-hero-icon" size={80} />}
                            <div className="detail-badge">{selectedPlace.type}</div>
                        </div>

                        <div className="detail-content">
                            <div className="detail-header">
                                <div className="detail-title">
                                    <h1>{selectedPlace.name}</h1>
                                    <div className="detail-subtitle">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={16} color="#60a5fa" />
                                            {selectedPlace.lat.toFixed(4)}, {selectedPlace.lon.toFixed(4)}
                                        </span>
                                        <span>•</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981' }}>
                                            <Navigation size={16} />
                                            {selectedPlace.distance?.toFixed(2)} km away
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-actions">
                                    <button className="btn-direction" onClick={() => openInMaps(selectedPlace.lat, selectedPlace.lon)}>
                                        <Navigation size={18} />
                                        Get Directions
                                    </button>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3><Info size={20} color="#60a5fa" /> About this Place</h3>
                                <div className="detail-desc-box">
                                    <p>{getPlaceDescription(selectedPlace)}</p>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3><MapPin size={20} color="#60a5fa" /> Location Map</h3>
                                <div className="mini-map-container">
                                    <MapContainer
                                        key={selectedPlace.id} // Force re-render on change
                                        center={[selectedPlace.lat, selectedPlace.lon]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                        zoomControl={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OpenStreetMap'
                                        />
                                        <Marker position={[selectedPlace.lat, selectedPlace.lon]}>
                                            <Popup>{selectedPlace.name}</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            </div>

                            {/* Project Description footer if needed or keep clean */}
                        </div>
                    </>
                ) : (
                    <div className="np-placeholder">
                        <Compass size={64} strokeWidth={1} />
                        <h2>Select a place to view details</h2>
                        <p>Choose a location from the list on the left.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
