// Live route map (Android / iOS build): the shared map page (mapDocument.js) inside a WebView. Leaflet + OpenStreetMap, so
// there is no Google Maps key to set up, restrict or pay for, and the map looks the same as the web one.
// Source of truth: /shared/native/LiveMap.native.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { mapDocument, mapMessage } from './mapDocument';
import { API_URL } from './api';
import { COLORS } from './theme';
import { useTheme } from './themeRuntime';

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding }) {
  const { mode } = useTheme();
  const web = useRef(null);
  const [ready, setReady] = useState(false);
  // baseUrl gives the page an origin, so the tile server sees a referrer that names this app's backend.
  const source = useMemo(() => ({ html: mapDocument(), baseUrl: `${API_URL}/` }), []);

  useEffect(() => {
    if (!ready) return;
    const message = JSON.stringify(mapMessage({ path, stops, buses, highlightStop, padding }, mode));
    web.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message', { data: ${message} })); true;`);
  }, [ready, path, stops, buses, highlightStop, padding, mode]);

  return (
    <View style={[styles.fill, { backgroundColor: COLORS.bg }]}>
      <WebView
        ref={web}
        source={source}
        style={[styles.fill, { backgroundColor: COLORS.bg }]}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        onMessage={(e) => { if (e.nativeEvent.data === 'sb-map-ready') setReady(true); }}
        // If the page's process is killed (low memory), start it again and wait for its ready message.
        onRenderProcessGone={() => { setReady(false); web.current?.reload(); }}
        onContentProcessDidTerminate={() => { setReady(false); web.current?.reload(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
});
