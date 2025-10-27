'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom bus icon
const createBusIcon = (status) => {
  const color = status === 'running' ? '#22c55e' : '#ef4444'
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        🚌
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

// Component to handle map updates when selected bus changes
function MapUpdater({ selectedBus }) {
  const map = useMap()
  
  useEffect(() => {
    if (selectedBus?.currentLocation) {
      map.flyTo([selectedBus.currentLocation.lat, selectedBus.currentLocation.lng], 14, {
        duration: 1
      })
    }
  }, [selectedBus, map])
  
  return null
}

const BusMap = ({ buses = [], selectedBus, onBusClick }) => {
  const defaultCenter = [28.6139, 77.2090] // Delhi coordinates
  const defaultZoom = 12

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater selectedBus={selectedBus} />
      
      {buses.map((bus) => {
        if (!bus.currentLocation) return null
        
        const isSelected = selectedBus?.id === bus.id
        
        return (
          <div key={bus.id}>
            {/* Bus marker */}
            <Marker
              position={[bus.currentLocation.lat, bus.currentLocation.lng]}
              icon={createBusIcon(bus.status)}
              eventHandlers={{
                click: () => onBusClick?.(bus)
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">{bus.busNumber}</h3>
                  <p className="text-sm font-semibold mb-1">{bus.routeName}</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Status:</strong> <span className={`font-semibold ${bus.status === 'running' ? 'text-green-600' : 'text-red-600'}`}>{bus.status}</span></p>
                    <p><strong>Speed:</strong> {bus.speed} km/h</p>
                    <p><strong>Next Stop:</strong> {bus.nextStop}</p>
                    <p><strong>ETA:</strong> {bus.estimatedArrival}</p>
                    <p><strong>Passengers:</strong> {bus.currentPassengers}/{bus.capacity}</p>
                    <p><strong>Driver:</strong> {bus.driver}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Route line for selected bus */}
            {isSelected && bus.stops && (
              <Polyline
                positions={bus.stops.map(stop => [stop.lat, stop.lng])}
                color="#3b82f6"
                weight={3}
                opacity={0.7}
                dashArray="10, 10"
              />
            )}
            
            {/* Stop markers for selected bus */}
            {isSelected && bus.stops && bus.stops.map((stop, idx) => (
              <Marker
                key={`${bus.id}-stop-${idx}`}
                position={[stop.lat, stop.lng]}
                icon={L.divIcon({
                  className: 'custom-stop-marker',
                  html: `
                    <div style="
                      background-color: #3b82f6;
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      border: 2px solid white;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                    "></div>
                  `,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="font-semibold">{stop.name}</p>
                    <p className="text-xs text-gray-600">Stop {idx + 1} of {bus.stops.length}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </div>
        )
      })}
    </MapContainer>
  )
}

export default BusMap