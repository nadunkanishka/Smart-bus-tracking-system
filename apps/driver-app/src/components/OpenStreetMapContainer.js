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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function OpenStreetMapContainer({
  isOnDuty,
  routeName = '138',
  liveCoordinate,
  startCoordinate = ROUTE_138_START,
  endCoordinate = ROUTE_138_END,
}) {
  const activeCoordinate = liveCoordinate || DEFAULT_BUS_COORDINATE;
  const routeUrl = buildOsrmRouteUrl({
    startCoordinate,
    endCoordinate,
    waypoints: ROUTE_138_WAYPOINTS,
  });
  const fallbackRouteJson = JSON.stringify(ROUTE_138_FALLBACK_COORDS);
  const markerStatus = isOnDuty ? 'LIVE GPS' : 'OFFLINE';

  const osmHtml = `
    <!DOCTYPE html>
    <html style="width:100%; height:100%; margin:0; padding:0;">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #FAFAFA; }
        .driver-osm-pill {
          background-color: ${isOnDuty ? '#05A357' : '#18181B'};
          color: #FFFFFF;
          padding: 6px 14px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
          font-size: 12px;
          font-weight: 700;
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const busPosition = [${activeCoordinate.latitude}, ${activeCoordinate.longitude}];
        const fallbackRoute = ${fallbackRouteJson}.map(({ latitude, longitude }) => [latitude, longitude]);
        const map = L.map('map', { zoomControl: false }).setView(busPosition, 14);

        L.tileLayer('${OSM_TILE_URL}', {
          maxZoom: 19,
          attribution: '${OSM_ATTRIBUTION}'
        }).addTo(map);

        const busIcon = L.divIcon({
          className: 'driver-marker-wrapper',
          html: '<div class="driver-osm-pill">NB-4521 ${escapeHtml(markerStatus)}</div>',
          iconSize: [150, 32],
          iconAnchor: [75, 16]
        });
        L.marker(busPosition, { icon: busIcon }).addTo(map);

        function drawRoute(points) {
          const routeLine = L.polyline(points, { color: '#276EF1', weight: 6, opacity: 0.9 }).addTo(map);
          map.fitBounds(routeLine.getBounds(), { padding: [48, 48], maxZoom: 14 });
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
      <iframe title="Driver OpenStreetMap View" srcDoc={osmHtml} style={styles.webMap} />
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
    backgroundColor: '#FAFAFA',
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
