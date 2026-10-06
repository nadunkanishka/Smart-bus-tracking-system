// Live route map (web build): Leaflet + OpenStreetMap inside one long-lived iframe.
// The iframe document is created once; route, stops and bus positions are sent with postMessage, and each bus
// marker glides from its last position to the new one so movement between 3-second GPS fixes is smooth.
// Source of truth: /shared/native/LiveMap.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { vehicleSvgString } from './vehicleShapes';

// The 8 drawn headings (index = model heading / 45). Index 0 is the three-quarter view used when a fix has no heading.
const BUS_SVGS = [0, 45, 90, 135, 180, 225, 270, 315].map((heading) => vehicleSvgString('bus', { marker: true, size: 52, heading }));

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const html = () => `<!DOCTYPE html>
<html style="width:100%;height:100%;margin:0"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { width: 100%; height: 100%; margin: 0; background: #EEF2F7; }
  .leaflet-tile-pane { filter: grayscale(1) brightness(1.1) contrast(0.78); }
  .sb-bus { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; }
  .sb-bus.stale { opacity: .55; }
  .sb-stop { width: 12px; height: 12px; border-radius: 50%; background: #0F1419; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(15,20,25,.3); }
  .sb-stop.on { width: 18px; height: 18px; background: #F26B85; }
  .sb-route { stroke-dasharray: 6000; stroke-dashoffset: 6000; animation: draw 1.4s cubic-bezier(.23,1,.32,1) forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @media (prefers-reduced-motion: reduce) { .sb-route { animation: none; stroke-dashoffset: 0; } }
  .leaflet-control-attribution { font: 10px system-ui; background: rgba(255,255,255,.7); }
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false }).setView([6.9, 79.87], 12);
  L.tileLayer('${TILE_URL}', { subdomains: 'abc', maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  var busSvgs = ${JSON.stringify(BUS_SVGS)};
  function busSvg(h) { return busSvgs[h == null || isNaN(h) ? 0 : ((Math.round((225 + Number(h)) / 45) % 8) + 8) % 8]; }
  var routeLine = null, routeKey = '', stopLayer = L.layerGroup().addTo(map), buses = {}, pad = { top: 40, bottom: 40 };
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fit() {
    if (routeLine) map.fitBounds(routeLine.getBounds(), { paddingTopLeft: [32, pad.top], paddingBottomRight: [32, pad.bottom], maxZoom: 15 });
  }
  // Glide a marker to its new position over roughly the time since its last update.
  function glide(b, to) {
    var from = b.marker.getLatLng(), start = performance.now();
    var dur = still ? 0 : Math.max(300, Math.min(3500, start - (b.at || start - 3000)));
    b.at = start;
    cancelAnimationFrame(b.raf);
    (function step(now) {
      var t = dur ? Math.min(1, (now - start) / dur) : 1;
      b.marker.setLatLng([from.lat + (to[0] - from.lat) * t, from.lng + (to[1] - from.lng) * t]);
      if (t < 1) b.raf = requestAnimationFrame(step);
    })(start);
  }
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.type !== 'sb-map') return;
    pad = d.padding || pad;
    var key = JSON.stringify([d.path, d.padding]);
    if (key !== routeKey) {
      routeKey = key;
      if (routeLine) map.removeLayer(routeLine);
      routeLine = d.path && d.path.length > 1 ? L.polyline(d.path, { color: '#F26B85', weight: 6, lineCap: 'round', lineJoin: 'round', className: 'sb-route' }).addTo(map) : null;
      fit();
    }
    stopLayer.clearLayers();
    (d.stops || []).forEach(function (s, i) {
      var on = i === d.highlightStop;
      L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: '<div class="sb-stop' + (on ? ' on' : '') + '"></div>', iconSize: on ? [18, 18] : [12, 12] }), title: s.name, keyboard: false }).addTo(stopLayer);
    });
    var seen = {};
    (d.buses || []).forEach(function (bus) {
      seen[bus.id] = 1;
      var b = buses[bus.id];
      if (!b) {
        b = buses[bus.id] = { marker: L.marker([bus.lat, bus.lng], { icon: L.divIcon({ className: '', html: '<div class="sb-bus">' + busSvg(bus.heading) + '</div>', iconSize: [52, 52], iconAnchor: [26, 26] }), title: bus.label || bus.id, zIndexOffset: 500 }).addTo(map) };
        if (!routeLine) map.setView([bus.lat, bus.lng], 15);
      } else glide(b, [bus.lat, bus.lng]);
      var el = b.marker.getElement(); if (el && el.firstChild) { el.firstChild.className = 'sb-bus' + (bus.stale ? ' stale' : ''); if (b.h !== bus.heading) { b.h = bus.heading; el.firstChild.innerHTML = busSvg(bus.heading); } }
    });
    Object.keys(buses).forEach(function (id) { if (!seen[id]) { map.removeLayer(buses[id].marker); delete buses[id]; } });
  });
  parent.postMessage({ type: 'sb-map-ready' }, '*');
</script></body></html>`;

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding }) {
  const frame = useRef(null);
  const [ready, setReady] = useState(false);
  const doc = useMemo(html, []);

  useEffect(() => {
    const onMessage = (e) => { if (e.source === frame.current?.contentWindow && e.data?.type === 'sb-map-ready') setReady(true); };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: 'sb-map', path, stops, buses, highlightStop, padding }, '*');
  }, [ready, path, stops, buses, highlightStop, padding]);

  return (
    <View style={styles.fill}>
      <iframe ref={frame} title="Live bus map" srcDoc={doc} style={styles.frame} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#EEF2F7' },
  frame: { width: '100%', height: '100%', border: 'none' },
});
