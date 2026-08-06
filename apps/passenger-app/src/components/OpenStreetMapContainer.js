import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  buildOsrmRouteUrl,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  ROUTE_138_END,
  ROUTE_138_FALLBACK_COORDS,
  ROUTE_138_START,
  ROUTE_138_WAYPOINTS,
} from '../utils/route138';

const DEFAULT_BUS_COORDINATE = ROUTE_138_WAYPOINTS[2];
const DEFAULT_PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function OpenStreetMapContainer({
  busLocationName = 'High Level Road Stop',
  etaMins = 4,
  busCoordinate,
  passengerCoordinate,
  startCoordinate = ROUTE_138_START,
  endCoordinate = ROUTE_138_END,
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
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #F4F7FB; }
        .bus-pill, .stop-pill {
          color: #FFFFFF;
          padding: 6px 14px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
          font-size: 12px;
          font-weight: 700;
          border: 2px solid #FFFFFF;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
          white-space: nowrap;
        }
        .bus-pill { background-color: #0F172A; }
        .stop-pill { background-color: #2563EB; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const busPosition = [${activeBusCoordinate.latitude}, ${activeBusCoordinate.longitude}];
        const passengerPosition = [${activePassengerCoordinate.latitude}, ${activePassengerCoordinate.longitude}];
        const fallbackRoute = ${fallbackRouteJson}.map(({ latitude, longitude }) => [latitude, longitude]);
        const map = L.map('map', { zoomControl: false }).setView(busPosition, 14);

        L.tileLayer('${OSM_TILE_URL}', {
          maxZoom: 19,
          attribution: '${OSM_ATTRIBUTION}'
        }).addTo(map);

        function badgeIcon(className, text, width) {
          return L.divIcon({
            className: 'passenger-marker-wrapper',
            html: '<div class="' + className + '">' + text + '</div>',
            iconSize: [width, 32],
            iconAnchor: [width / 2, 16]
          });
        }

        function drawRoute(points) {
          const routeLine = L.polyline(points, { color: '#2563EB', weight: 6, opacity: 0.9 }).addTo(map);
          const group = L.featureGroup([
            L.marker(busPosition, {
              icon: badgeIcon('bus-pill', 'NB-4521 ${escapeHtml(busLocationName)} · ${etaMins} min', 190)
            }),
            L.marker(passengerPosition, {
              icon: badgeIcon('stop-pill', 'Your stop', 92)
            }),
            routeLine
          ]);
          map.fitBounds(group.getBounds(), { padding: [44, 44], maxZoom: 15 });
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
    backgroundColor: '#F4F7FB',
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
