import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

const ROUTE_138_COORDS = [
  { latitude: 6.9344, longitude: 79.8428 },
  { latitude: 6.9147, longitude: 79.8778 },
  { latitude: 6.8721, longitude: 79.8884 },
  { latitude: 6.8480, longitude: 79.9265 },
];

const DEFAULT_BUS_COORDINATE = ROUTE_138_COORDS[2];
const DEFAULT_PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };

function getNativeMaps() {
  if (Platform.OS === 'web') {
    return {};
  }

  const maps = require('react-native-maps');
  return {
    MapView: maps.default,
    Marker: maps.Marker,
    Polyline: maps.Polyline,
    PROVIDER_GOOGLE: maps.PROVIDER_GOOGLE,
  };
}

export default function GoogleMapContainer({
  busLocationName = 'High Level Rd',
  etaMins = 4,
  apiKey,
  busCoordinate,
  passengerCoordinate,
}) {
  const isWeb = Platform.OS === 'web';
  const googleApiKey =
    apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
  const activeBusCoordinate = busCoordinate || DEFAULT_BUS_COORDINATE;
  const activePassengerCoordinate = passengerCoordinate || DEFAULT_PASSENGER_COORDINATE;
  const { MapView, Marker, Polyline, PROVIDER_GOOGLE } = getNativeMaps();

  const region = {
    latitude: activeBusCoordinate.latitude,
    longitude: activeBusCoordinate.longitude,
    latitudeDelta: 0.055,
    longitudeDelta: 0.055,
  };

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
        .bus-pill, .stop-pill {
          color: #FFFFFF;
          padding: 5px 12px;
          border-radius: 18px;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          white-space: nowrap;
        }
        .bus-pill {
          background-color: #18181B;
        }
        .stop-pill {
          background-color: #276EF1;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        function createBadgeMarker(map, position, html, xOffset, yOffset) {
          class BadgeMarker extends google.maps.OverlayView {
            constructor(latlng, mapInstance) {
              super();
              this.latlng = latlng;
              this.setMap(mapInstance);
            }
            onAdd() {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.innerHTML = html;
              this.div = div;
              this.getPanes().overlayMouseTarget.appendChild(div);
            }
            draw() {
              const point = this.getProjection().fromLatLngToDivPixel(this.latlng);
              if (this.div && point) {
                this.div.style.left = (point.x - xOffset) + 'px';
                this.div.style.top = (point.y - yOffset) + 'px';
              }
            }
          }

          new BadgeMarker(new google.maps.LatLng(position.lat, position.lng), map);
        }

        function initMap() {
          const busPosition = { lat: ${activeBusCoordinate.latitude}, lng: ${activeBusCoordinate.longitude} };
          const passengerPosition = { lat: ${activePassengerCoordinate.latitude}, lng: ${activePassengerCoordinate.longitude} };
          const map = new google.maps.Map(document.getElementById("map"), {
            center: busPosition,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: false,
            styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
          });

          new google.maps.Polyline({
            path: [
              { lat: 6.9344, lng: 79.8428 },
              { lat: 6.9147, lng: 79.8778 },
              busPosition,
              { lat: 6.8480, lng: 79.9265 }
            ],
            geodesic: true,
            strokeColor: "#276EF1",
            strokeOpacity: 0.85,
            strokeWeight: 6,
            map
          });

          createBadgeMarker(map, busPosition, '<div class="bus-pill">NB-4521 live at ${busLocationName} - ${etaMins} min</div>', 80, 15);
          createBadgeMarker(map, passengerPosition, '<div class="stop-pill">Your stop</div>', 45, 15);
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
          title="Passenger Google Maps API View"
          srcDoc={googleMapHtml}
          style={styles.webMap}
        />
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          loadingEnabled
        >
          <Polyline coordinates={ROUTE_138_COORDS} strokeColor={COLORS.signalBlue} strokeWidth={6} />
          <Marker coordinate={activeBusCoordinate} title="NB-4521" description={`${etaMins} min away`}>
            <View style={styles.busMarkerBadge}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.busBadgeText}>NB-4521 live</Text>
            </View>
          </Marker>
          <Marker coordinate={activePassengerCoordinate} title="Your stop">
            <View style={styles.passengerPinMarker}>
              <View style={styles.pinDot} />
              <Text style={styles.pinLabel}>Your Stop</Text>
            </View>
          </Marker>
        </MapView>
      )}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  busMarkerBadge: {
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
});
