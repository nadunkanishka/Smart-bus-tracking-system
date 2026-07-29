import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export default function OpenStreetMapContainer({ busLocationName = 'High Level Rd', etaMins = 4 }) {
  const isWeb = Platform.OS === 'web';

  const busLat = 6.8721;
  const busLng = 79.8884;

  const osmHtml = `
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
        .custom-bus-pill {
          background-color: #18181B;
          color: #FFFFFF;
          padding: 5px 12px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          white-space: nowrap;
        }
        .green-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #05A357;
        }
        .passenger-pin {
          background-color: #276EF1;
          color: #FFFFFF;
          padding: 4px 10px;
          border-radius: 14px;
          font-family: -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          const map = L.map('map', { zoomControl: false }).setView([6.8850, 79.8850], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          const route138Coords = [
            [6.9344, 79.8428],
            [6.9147, 79.8778],
            [${busLat}, ${busLng}],
            [6.8480, 79.9265]
          ];
          L.polyline(route138Coords, { color: '#276EF1', weight: 6, opacity: 0.85 }).addTo(map);

          const busIcon = L.divIcon({
            className: 'bus-marker-wrapper',
            html: '<div class="custom-bus-pill"><span class="green-pulse-dot"></span>🚌 NB-4521 (Route 138)</div>',
            iconSize: [140, 30],
            iconAnchor: [70, 15]
          });
          L.marker([${busLat}, ${busLng}], { icon: busIcon }).addTo(map);

          const passengerIcon = L.divIcon({
            className: 'passenger-pin-wrapper',
            html: '<div class="passenger-pin">📍 Your Stop (Kirulapone)</div>',
            iconSize: [130, 26],
            iconAnchor: [65, 13]
          });
          L.marker([6.8900, 79.8750], { icon: passengerIcon }).addTo(map);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {isWeb ? (
        <iframe
          title="Passenger OpenStreetMap View"
          srcDoc={osmHtml}
          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}

      {/* Cross-platform OpenStreetMap Visual Map Layer */}
      <View style={styles.osmCanvasLayer}>
        <View style={styles.osmMainRoad} />
        <View style={styles.osmCrossRoad} />
        <View style={styles.osmPolylineBlue} />

        {/* Live OpenStreetMap Bus Location Badge */}
        <View style={styles.osmBusMarkerBadge}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.busBadgeText}>🚌 NB-4521 • Live on Route 138</Text>
        </View>

        {/* Passenger Stop Marker Pin */}
        <View style={styles.passengerPinMarker}>
          <View style={styles.pinDot} />
          <Text style={styles.pinLabel}>Your Stop (Kirulapone)</Text>
        </View>

        {/* OpenStreetMap Attribution Watermark */}
        <View style={styles.osmAttributionWatermark}>
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
    top: '42%',
    left: '-10%',
    width: '120%',
    height: 24,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-10deg' }],
  },
  osmCrossRoad: {
    position: 'absolute',
    top: '10%',
    left: '42%',
    width: 16,
    height: '80%',
    backgroundColor: '#FFFFFF',
  },
  osmPolylineBlue: {
    position: 'absolute',
    top: '44%',
    left: '12%',
    width: '72%',
    height: 8,
    backgroundColor: COLORS.signalBlue, // Uber Blue #276EF1
    borderRadius: 4,
    transform: [{ rotate: '-10deg' }],
  },
  osmBusMarkerBadge: {
    position: 'absolute',
    top: '38%',
    left: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.zinc900,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 10,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.signalGreen,
    marginRight: 8,
  },
  busBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  passengerPinMarker: {
    position: 'absolute',
    top: '48%',
    left: '70%',
    alignItems: 'center',
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.signalBlue,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.zinc900,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  osmAttributionWatermark: {
    position: 'absolute',
    bottom: 120,
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
