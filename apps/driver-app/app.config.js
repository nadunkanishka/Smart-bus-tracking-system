const appJson = require('./app.json');

const realKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsApiKey = realKey || 'YOUR_GOOGLE_MAPS_API_KEY';

// Android draws every map with the Google Maps SDK, which shows a blank map when the key is the placeholder. EAS builds run on
// Expo's servers, so the key must be an EAS variable, not something typed in your own terminal:
//   eas env:create --name GOOGLE_MAPS_API_KEY --value <key> --environment preview --visibility secret
// A build without it stops here instead of producing an APK with an empty map.
if (!realKey) {
  const msg = 'GOOGLE_MAPS_API_KEY is not set: maps will be blank on Android. See docs/DEPLOYMENT.md (Maps key).';
  if (process.env.EAS_BUILD === 'true' && process.env.EAS_BUILD_PROFILE !== 'development') throw new Error(msg);
  console.warn(`[app.config] ${msg}`);
}

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      config: {
        ...appJson.expo.ios?.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        googleMaps: {
          ...appJson.expo.android?.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
  },
};
