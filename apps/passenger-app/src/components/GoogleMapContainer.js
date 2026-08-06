import React from 'react';
import { StyleSheet, View } from 'react-native';

const DEFAULT_BUS_COORDINATE = { latitude: 6.8721, longitude: 79.8884 };
const DEFAULT_PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };

export default function GoogleMapContainer({
  busLocationName = 'High Level Rd',
  etaMins = 4,
  apiKey,
  busCoordinate,
  passengerCoordinate,
}) {
  const googleApiKey =
    apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
  const activeBusCoordinate = busCoordinate || DEFAULT_BUS_COORDINATE;
  const activePassengerCoordinate = passengerCoordinate || DEFAULT_PASSENGER_COORDINATE;

  const googleMapHtml = `
    <!DOCTYPE html>
    <html style="width:100%; height:100%; margin:0; padding:0;">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #FAFAFA; }
        .map-badge {
          background-color: #18181B;
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

          new google.maps.Marker({ position: busPosition, map, title: "NB-4521" });
          new google.maps.Marker({ position: passengerPosition, map, title: "Your stop" });

          const badge = document.createElement('div');
          badge.className = 'map-badge';
          badge.textContent = 'NB-4521 live at ${busLocationName} - ${etaMins} min';
          map.controls[google.maps.ControlPosition.TOP_CENTER].push(badge);
        }
      </script>
      <script src="https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&callback=initMap" async defer></script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <iframe title="Passenger Google Maps API View" srcDoc={googleMapHtml} style={styles.webMap} />
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
