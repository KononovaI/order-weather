import { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onLocationSelect, initialLocation }) {
  const [marker, setMarker] = useState(initialLocation || null);
  const [placeName, setPlaceName] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Set initial marker if provided
  useEffect(() => {
    if (initialLocation && !marker) {
      setMarker(initialLocation);
      reverseGeocode(initialLocation.lat, initialLocation.lng).then(name => {
        onLocationSelect({ ...initialLocation, placeName: name });
      });
    }
  }, [initialLocation]);

  // Reverse geocode coordinates to get place name
  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      const name = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setPlaceName(name);
      return name;
    } catch (error) {
      console.error('Geocoding error:', error);
      setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Handle map clicks
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setMarker({ lat, lng });
      const name = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng, placeName: name });
    },
  });

  // Handle marker drag
  const handleMarkerDrag = useCallback(async (e) => {
    const { lat, lng } = e.target.getLatLng();
    setMarker({ lat, lng });
    const name = await reverseGeocode(lat, lng);
    onLocationSelect({ lat, lng, placeName: name });
  }, [reverseGeocode, onLocationSelect]);

  return marker ? (
    <Marker
      position={[marker.lat, marker.lng]}
      draggable={true}
      eventHandlers={{
        dragend: handleMarkerDrag,
      }}
    >
      <Popup>
        <div className="marker-popup">
          {isGeocoding ? (
            <p><em>Loading location name...</em></p>
          ) : (
            <>
              <strong>{placeName}</strong>
              <br />
              <small>
                Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}
              </small>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  ) : null;
}

function MapLocationPicker({ onLocationSelect, initialCenter }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  const handleRemoveMarker = () => {
    setSelectedLocation(null);
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  const handleExportJSON = () => {
    if (!selectedLocation) return;

    const jsonData = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      placeName: selectedLocation.placeName
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'location.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const center = useMemo(() => initialCenter || [51.505, -0.09], [initialCenter]); // Use provided center or default to London

  return (
    <div className="map-location-picker">
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onLocationSelect={handleLocationSelect}
            initialLocation={initialCenter ? { lat: initialCenter[0], lng: initialCenter[1] } : null}
          />
        </MapContainer>
      </div>

      <div className="map-controls">
        <button
          onClick={handleRemoveMarker}
          disabled={!selectedLocation}
          className="map-control-btn"
        >
          Remove Marker
        </button>
        <button
          onClick={handleExportJSON}
          disabled={!selectedLocation}
          className="map-control-btn export-btn"
        >
          Export JSON
        </button>
      </div>

      {selectedLocation && (
        <div className="location-info">
          <p><strong>Selected Location:</strong></p>
          <p className="location-name">{selectedLocation.placeName}</p>
          <p className="location-coords">
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}

export default MapLocationPicker;