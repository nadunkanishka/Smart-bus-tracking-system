import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export default function GoogleMapContainer({ isOnDuty, routeName, apiKey }) {
  const isWeb = Platform.OS === 'web';
  const googleApiKey = apiKey || 'YOUR_GOOGLE_MAPS_API_KEY';

  const busLat = 6.8721;
  const busLng = 79.8884;

  const googleMapHtml = `
    <!DOCTYPE html>
    <html style="width:100%; height:100%; margin:0; padding:0;">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        html, body, #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background: #FAFAFA;
        }
        .driver-google-pill {
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
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          white-space: nowrap;
        }
        .green-pulse-dot {
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
        function initMap() {
          const map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: ${busLat}, lng: ${busLng} },
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: false,
            styles: [
              {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
              }
            ]
          });

          // Route 138 Uber Blue Polyline
          const routePathCoords = [
            { lat: 6.9344, lng: 79.8428 },
            { lat: 6.9147, lng: 79.8778 },
            { lat: ${busLat}, lng: ${busLng} },
            { lat: 6.8480, lng: 79.9265 }
          ];

          new google.maps.Polyline({
            path: routePathCoords,
            geodesic: true,
            strokeColor: "#276EF1",
            strokeOpacity: 0.85,
            strokeWeight: 6,
            map: map
          });

          // Custom Google Maps Overlay Badge Marker
          class CustomGoogleMarker extends google.maps.OverlayView {
            constructor(latlng, map) {
              super();
              this.latlng = latlng;
              this.setMap(map);
            }
            onAdd() {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.innerHTML = '<div class="driver-google-pill"><span class="green-pulse-dot"></span>🚌 NB-4521 (${isOnDuty ? 'LIVE GPS' : 'OFFLINE'})</div>';
              this.div = div;
              this.getPanes().overlayMouseTarget.appendChild(div);
            }
            draw() {
              const overlayProjection = this.getProjection();
              const position = overlayProjection.fromLatLngToDivPixel(this.latlng);
              if (this.div && position) {
                this.div.style.left = (position.x - 75) + 'px';
                this.div.style.top = (position.y - 17) + 'px';
              }
            }
            onRemove() {
              if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            }
          }

          new CustomGoogleMarker(new google.maps.LatLng(${busLat}, ${busLng}), map);
        }
      </script>
      <script src="https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&callback=initMap" async defer></script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {isWeb ? (
        <iframe
          title="Driver Google Maps API View"
          srcDoc={googleMapHtml}
          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}

      {/* Google Maps Visual Backdrop Fallback */}
      <View style={styles.googleCanvasLayer}>
        <View style={styles.googleHighwayLine} />
        <View style={styles.googleCrossRoad} />
        <View style={styles.googlePolylineBlue} />

        {/* Live Vehicle Google Badge Marker */}
        <View style={[styles.driverMarkerBadge, { backgroundColor: isOnDuty ? COLORS.signalGreen : COLORS.zinc900 }]}>
          <View style={styles.whitePulseDot} />
          <Text style={styles.driverBadgeText}>🚌 NB-4521 ({isOnDuty ? 'ONLINE' : 'OFFLINE'})</Text>
        </View>

        <View style={styles.googleAttributionTag}>
          <Text style={styles.googleTagText}>Google Maps API • Live Telemetry</Text>
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
    backgroundColor: '#FAFAFA',
  },
  googleCanvasLayer: {
    flex: 1,
    position: 'relative',
  },
  googleHighwayLine: {
    position: 'absolute',
    top: '38%',
    left: '-10%',
    width: '120%',
    height: 22,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-12deg' }],
  },
  googleCrossRoad: {
    position: 'absolute',
    top: '15%',
    left: '42%',
    width: 14,
    height: '80%',
    backgroundColor: '#FFFFFF',
  },
  googlePolylineBlue: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: '75%',
    height: 8,
    backgroundColor: COLORS.signalBlue, // Uber Blue #276EF1
    borderRadius: 4,
    transform: [{ rotate: '-12deg' }],
  },
  driverMarkerBadge: {
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
  whitePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  driverBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  googleAttributionTag: {
    position: 'absolute',
    top: 90,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  googleTagText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.zinc600,
  },
});
