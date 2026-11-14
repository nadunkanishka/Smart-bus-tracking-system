// Live route map (web build): the shared map page (mapDocument.js) inside one long-lived iframe.
// The iframe document is created once; route, stops and bus positions are sent with postMessage.
// Source of truth: /shared/native/LiveMap.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { mapDocument, mapMessage } from './mapDocument';
import { COLORS } from './theme';
import { useTheme } from './themeRuntime';

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding }) {
  const { mode } = useTheme();
  const frame = useRef(null);
  const [ready, setReady] = useState(false);
  const doc = useMemo(mapDocument, []);

  useEffect(() => {
    const onMessage = (e) => { if (e.source === frame.current?.contentWindow && e.data?.type === 'sb-map-ready') setReady(true); };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    // An srcDoc iframe keeps its parent's origin, so the message is addressed to this page's own origin.
    if (ready) frame.current?.contentWindow?.postMessage(mapMessage({ path, stops, buses, highlightStop, padding }, mode), window.location.origin);
  }, [ready, path, stops, buses, highlightStop, padding, mode]);

  return (
    <View style={[styles.fill, { backgroundColor: COLORS.bg }]}>
      <iframe ref={frame} title="Live bus map" srcDoc={doc} style={styles.frame} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  frame: { width: '100%', height: '100%', border: 'none' },
});
