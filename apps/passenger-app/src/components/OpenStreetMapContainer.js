import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  buildOsrmRouteUrl,
  ROUTE_138_END,
  ROUTE_138_FALLBACK_COORDS,
  ROUTE_138_START,
  ROUTE_138_WAYPOINTS,
} from '../utils/route138';

const DEFAULT_BUS_COORDINATE = ROUTE_138_WAYPOINTS[2];
const DEFAULT_PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };

// CartoDB Positron provides the clean, modern, off-white map matching the Orbix Studio 2025 UI reference
const CARTO_POSITRON_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export default function OpenStreetMapContainer({
  busLocationName = 'High Level Road Stop',
  etaMins = 4,
  busCoordinate,
  passengerCoordinate,
  startCoordinate = ROUTE_138_START,
  endCoordinate = ROUTE_138_END,
  interactive = true,
}) {
  const activeBusCoordinate = busCoordinate || DEFAULT_BUS_COORDINATE;
  const activePassengerCoordinate = passengerCoordinate || DEFAULT_PASSENGER_COORDINATE;
  const routeUrl = buildOsrmRouteUrl({
    startCoordinate,
    endCoordinate,
    waypoints: ROUTE_138_WAYPOINTS,
  });
  const fallbackRouteJson = JSON.stringify(ROUTE_138_FALLBACK_COORDS);

  const osmHtml = `
    <!DOCTYPE html>
    <html style="width:100%; height:100%; margin:0; padding:0;">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #F4F4F6; }
        .leaflet-container { background: #F4F4F6; }
        
        /* Orbix Studio 2025 Bus Direction Marker (Black disc with white directional arrow) */
        .orbix-bus-marker-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .orbix-bus-marker {
          width: 36px;
          height: 36px;
          background: #141416;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #FFFFFF;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          transition: transform 0.3s ease;
        }

        /* Orbix Studio 2025 Glowing Target Destination Beacon */
        .orbix-dest-marker {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dest-core {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF5B37;
          border: 3.5px solid #FFFFFF;
          box-shadow: 0 3px 12px rgba(255, 91, 55, 0.6);
          position: relative;
          z-index: 4;
        }
        .dest-halo {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 91, 55, 0.22);
          animation: orbixPulse 2.4s infinite ease-out;
        }
        .halo-1 { width: 30px; height: 30px; }
        .halo-2 { width: 44px; height: 44px; animation-delay: 0.8s; opacity: 0.7; }
        
        @keyframes orbixPulse {
          0% { transform: scale(0.75); opacity: 0.8; }
          50% { transform: scale(1.18); opacity: 0.3; }
          100% { transform: scale(0.75); opacity: 0.8; }
        }

        /* Micro floating ETA indicator on map */
        .orbix-eta-tag {
          background: #141416;
          color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          white-space: nowrap;
          margin-top: -8px;
        }

        .leaflet-control-attribution { display: none !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const busPosition = [${activeBusCoordinate.latitude}, ${activeBusCoordinate.longitude}];
        const passengerPosition = [${activePassengerCoordinate.latitude}, ${activePassengerCoordinate.longitude}];
        const fallbackRoute = ${fallbackRouteJson}.map(({ latitude, longitude }) => [latitude, longitude]);
        
        const map = L.map('map', { 
          zoomControl: false,
          attributionControl: false,
          dragging: ${interactive},
          touchZoom: ${interactive},
          scrollWheelZoom: ${interactive}
        }).setView(busPosition, 14);

        L.tileLayer('${CARTO_POSITRON_TILE_URL}', {
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        const busIcon = L.divIcon({
          className: 'orbix-bus-marker-wrapper',
          html: '<div class="orbix-bus-marker"><svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="12 2 19 21 12 17 5 21 12 2" /></svg></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const destIcon = L.divIcon({
          className: 'orbix-dest-wrapper',
          html: '<div class="orbix-dest-marker"><div class="dest-halo halo-2"></div><div class="dest-halo halo-1"></div><div class="dest-core"></div></div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        function drawRoute(points) {
          // Deep Charcoal obsidian route line matching reference
          const routeLine = L.polyline(points, { 
            color: '#18181B', 
            weight: 5, 
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          const busMarker = L.marker(busPosition, { icon: busIcon }).addTo(map);
          const destMarker = L.marker(passengerPosition, { icon: destIcon }).addTo(map);

          const group = L.featureGroup([busMarker, destMarker, routeLine]);
          map.fitBounds(group.getBounds(), { 
            paddingTopLeft: [40, 40],
            paddingBottomRight: [40, 180],
            maxZoom: 15 
          });
        }

        fetch('${routeUrl}')
          .then((response) => response.ok ? response.json() : Promise.reject(response))
          .then((data) => drawRoute(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])))
          .catch(() => drawRoute(fallbackRoute));
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <iframe title="Passenger OpenStreetMap View" srcDoc={osmHtml} style={styles.webMap} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#F4F4F6',
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
