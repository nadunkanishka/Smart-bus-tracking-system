// Live route map (Android / iOS build): the shared map page (mapDocument.js) inside a WebView. Leaflet + OpenStreetMap, so
// there is no Google Maps key to set up, restrict or pay for, and the map looks the same as the web one.
// Source of truth: /shared/native/LiveMap.native.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { mapDocument, mapMessage } from './mapDocument';
import { API_URL } from './api';
import { COLORS } from './theme';
import { useTheme } from './themeRuntime';
import { type } from './ui';

const START_TIMEOUT_MS = 12000;

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding }) {
  const { mode } = useTheme();
  const web = useRef(null);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState('');
  // baseUrl gives the page an origin, so the tile server sees a referrer that names this app's backend.
  const source = useMemo(() => ({ html: mapDocument(), baseUrl: `${API_URL}/` }), []);

  // The page is ready when it says so, or when the WebView reports it finished loading (whichever comes first).
  useEffect(() => {
    if (ready) return undefined;
    const timer = setTimeout(() => setProblem((p) => p || 'The map page did not start. Check the phone has internet.'), START_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const message = JSON.stringify(mapMessage({ path, stops, buses, highlightStop, padding }, mode));
    web.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message', { data: ${message} })); true;`);
  }, [ready, path, stops, buses, highlightStop, padding, mode]);

  const restart = () => { setReady(false); web.current?.reload(); };

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
        onLoadEnd={() => setReady(true)}
        onMessage={(e) => {
          const text = e.nativeEvent.data;
          if (text === 'sb-map-ready') setReady(true);
          else if (String(text).startsWith('sb-map-error')) setProblem(String(text).replace('sb-map-error: ', ''));
        }}
        onError={(e) => setProblem(`WebView error: ${e.nativeEvent.description}`)}
        onHttpError={(e) => setProblem(`WebView error: HTTP ${e.nativeEvent.statusCode}`)}
        // If the page's process is killed (low memory), start it again.
        onRenderProcessGone={restart}
        onContentProcessDidTerminate={restart}
      />
      {problem ? (
        <View style={styles.problem} pointerEvents="none">
          <Text style={styles.problemText}>Map problem: {problem}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  problem: { position: 'absolute', left: 16, right: 16, top: '45%', padding: 12, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine },
  problemText: { ...type('small'), color: COLORS.ink, textAlign: 'center' },
});
