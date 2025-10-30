'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.setIcon(defaultIcon)

// Major cities in West Bengal with coordinates
const cityCoordinates = {
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'howrah': { lat: 22.5958, lng: 88.2636 },
  'siliguri': { lat: 26.7271, lng: 88.4230 },
  'darjeeling': { lat: 27.0360, lng: 88.2663 },
  'digha': { lat: 21.5877, lng: 87.8145 },
  'kharagpur': { lat: 22.3039, lng: 87.3245 },
  'bardhaman': { lat: 23.2381, lng: 87.7669 },
  'asansol': { lat: 23.6841, lng: 86.9633 },
  'berhampore': { lat: 24.1034, lng: 88.2882 },
  'malda': { lat: 25.0186, lng: 88.1365 },
  'raiganj': { lat: 25.5779, lng: 88.1194 },
  'jalpaiguri': { lat: 26.5203, lng: 88.7254 },
  'bolpur': { lat: 23.6568, lng: 87.7339 },
  'bankura': { lat: 23.8386, lng: 87.0779 },
  'purulia': { lat: 23.3390, lng: 86.3716 },
  'haldia': { lat: 22.0268, lng: 88.0733 },
  'kalimpong': { lat: 27.0627, lng: 88.4652 },
  'coochbehar': { lat: 26.3247, lng: 88.7889 },
  'gosaba': { lat: 21.8147, lng: 88.7764 },
  'tarakeswar': { lat: 22.8614, lng: 88.0778 },
  'karimpur': { lat: 24.1534, lng: 88.3673 },
}

export default function RouteMapDisplay({ source, destination }) {
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]) // Default to Kolkata
  const [routePath, setRoutePath] = useState([])
  const [sourceCoord, setSourceCoord] = useState(null)
  const [destCoord, setDestCoord] = useState(null)

  useEffect(() => {
    if (source && destination) {
      const sourceLower = source.toLowerCase().trim()
      const destLower = destination.toLowerCase().trim()

      const sourceLocation = cityCoordinates[sourceLower]
      const destLocation = cityCoordinates[destLower]

      if (sourceLocation && destLocation) {
        setSourceCoord([sourceLocation.lat, sourceLocation.lng])
        setDestCoord([destLocation.lat, destLocation.lng])

        // Calculate center point between source and destination
        const centerLat = (sourceLocation.lat + destLocation.lat) / 2
        const centerLng = (sourceLocation.lng + destLocation.lng) / 2
        setMapCenter([centerLat, centerLng])

        // Create path from source to destination
        setRoutePath([[sourceLocation.lat, sourceLocation.lng], [destLocation.lat, destLocation.lng]])
      }
    }
  }, [source, destination])

  if (!source || !destination) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Select source and destination to see the route on map
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={8}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Source Marker (Green) */}
        {sourceCoord && (
          <Marker position={sourceCoord} icon={L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-green-600">Source</p>
                <p className="text-sm">{source}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (Red) */}
        {destCoord && (
          <Marker position={destCoord} icon={L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-red-600">Destination</p>
                <p className="text-sm">{destination}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line (Red) */}
        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            color="red"
            weight={3}
            opacity={0.8}
            dashArray="5, 5"
          />
        )}
      </MapContainer>
    </div>
  )
}
