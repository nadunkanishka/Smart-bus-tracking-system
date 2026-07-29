import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Leaflet DivIcon for Uber-style Bus Markers
const createBusIcon = (plate, route, isCongested) => {
  return L.divIcon({
    className: 'custom-bus-leaflet-icon',
    html: `
      <div style="
        background-color: #18181B;
        color: #FFFFFF;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid #FFFFFF;
        white-space: nowrap;
      ">
        <span style="
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: ${isCongested ? '#FFC043' : '#05A357'};
        "></span>
        <span>🚌 ${plate} (${route})</span>
      </div>
    `,
    iconSize: [120, 30],
    iconAnchor: [60, 15],
  });
};

export default function CommandMap() {
  const [filterQuery, setFilterQuery] = useState('');

  // Pettah to Maharagama Route 138 Path Coordinates (Colombo, Sri Lanka)
  const route138Polyline = [
    [6.9344, 79.8428], // Pettah Station
    [6.9147, 79.8778], // Nugegoda Flyover
    [6.8721, 79.8884], // Delkanda Junction
    [6.8480, 79.9265], // Maharagama
  ];

  const activeBuses = [
    { id: 'NB-4521', route: '138', lat: 6.8721, lng: 79.8884, speed: '38 km/h', status: 'On Schedule', isCongested: false },
    { id: 'NC-8802', route: '120', lat: 6.8900, lng: 79.8700, speed: '42 km/h', status: 'On Schedule', isCongested: false },
    { id: 'ND-1049', route: '177', lat: 6.9147, lng: 79.8778, speed: '24 km/h', status: 'Congestion', isCongested: true },
  ];

  const filteredBuses = activeBuses.filter(
    b => b.id.toLowerCase().includes(filterQuery.toLowerCase()) || b.route.includes(filterQuery)
  );

  return (
    <div className="left-map-command">
      {/* Map Filter Control Bar */}
      <div className="map-control-bar">
        <input
          type="text"
          className="map-search-input"
          placeholder="Filter route or bus (e.g. 138)..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
        <button className="btn-zinc-action">
          OpenStreetMap Fleet View ({filteredBuses.length})
        </button>
      </div>

      {/* Leaflet + OpenStreetMap Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[6.8850, 79.8850]}
          zoom={13}
          style={{ width: '100%', height: '100%', borderRadius: '16px' }}
          zoomControl={false}
        >
          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Uber Blue Polyline Layer */}
          <Polyline
            positions={route138Polyline}
            pathOptions={{ color: '#276EF1', weight: 6, opacity: 0.85 }}
          />

          {/* Live OpenStreetMap Bus Markers */}
          {filteredBuses.map((bus) => (
            <Marker
              key={bus.id}
              position={[bus.lat, bus.lng]}
              icon={createBusIcon(bus.id, bus.route, bus.isCongested)}
            >
              <Popup>
                <div style={{ padding: '4px', fontSize: '12px' }}>
                  <strong>Bus: {bus.id}</strong><br />
                  Route: {bus.route}<br />
                  Speed: {bus.speed}<br />
                  Status: {bus.status}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
