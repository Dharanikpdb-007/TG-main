import SafetyMap from '../components/SafetyMap'

export default function MapPage() {
    return (
        <div style={{ height: 'calc(100vh - 144px)', width: '100%', position: 'relative' }}>
            <SafetyMap />
            {/* Subtract bottom nav height if needed, usually Layout handles padding but Map wants verify specifically */}
        </div>
    )
}
