import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export default function OpenStreetMapContainer({ isOnDuty, routeName }) {
  const isWeb = Platform.OS === 'web';

  const busLat = 6.8721;
  const busLng = 79.8884;

  const osmDriverHtml = `
    <!DOCTYPE html>
    <html style="width:100%; height:100%; margin:0; padding:0;">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background: #F2F4F7;
        }
        .driver-bus-pill {
          background-color: ${isOnDuty ? '#05A357' : '#18181B'};
          color: #FFFFFF;
          padding: 6px 14px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          white-space: nowrap;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #FFFFFF;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          const map = L.map('map', { zoomControl: false }).setView([${busLat}, ${busLng}], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          const routeCoords = [
            [6.9344, 79.8428],
            [6.9147, 79.8778],
            [${busLat}, ${busLng}],
            [6.8480, 79.9265]
          ];
          L.polyline(routeCoords, { color: '#276EF1', weight: 6, opacity: 0.85 }).addTo(map);

          const driverIcon = L.divIcon({
            className: 'driver-marker-wrapper',
            html: '<div class="driver-bus-pill"><span class="live-dot"></span>🚌 NB-4521 (${isOnDuty ? 'LIVE' : 'STANDBY'})</div>',
            iconSize: [160, 34],
            iconAnchor: [80, 17]
          });
          L.marker([${busLat}, ${busLng}], { icon: driverIcon }).addTo(map);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {isWeb ? (
        <iframe
          title="Driver OpenStreetMap View"
          srcDoc={osmDriverHtml}
          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}

      <View style={styles.osmCanvasLayer}>
        <View style={styles.osmMainRoad} />
        <View style={styles.osmCrossRoad} />
        <View style={styles.osmPolylineBlue} />

        <View style={[styles.driverMarkerPill, { backgroundColor: isOnDuty ? COLORS.signalGreen : COLORS.zinc900 }]}>
          <View style={styles.whiteDot} />
          <Text style={styles.driverPillText}>🚌 NB-4521 ({isOnDuty ? 'ONLINE' : 'OFFLINE'})</Text>
        </View>

        <View style={styles.osmWatermarkTag}>
          <Text style={styles.watermarkText}>© OpenStreetMap contributors</Text>
        </View>
      </View>
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
    backgroundColor: '#F2F4F7',
  },
  osmCanvasLayer: {
    flex: 1,
    position: 'relative',
  },
  osmMainRoad: {
    position: 'absolute',
    top: '38%',
    left: '-10%',
    width: '120%',
    height: 22,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-12deg' }],
  },
  osmCrossRoad: {
    position: 'absolute',
    top: '15%',
    left: '42%',
    width: 14,
    height: '80%',
    backgroundColor: '#FFFFFF',
  },
  osmPolylineBlue: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: '75%',
    height: 8,
    backgroundColor: COLORS.signalBlue,
    borderRadius: 4,
    transform: [{ rotate: '-12deg' }],
  },
  driverMarkerPill: {
    position: 'absolute',
    top: '34%',
    left: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 10,
  },
  whiteDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  driverPillText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  osmWatermarkTag: {
    position: 'absolute',
    top: 90,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.zinc500,
  },
});
