// SmartBus clay bus builder (Three.js r128, plain browser script → window.ClayBus).
// One parametric builder makes every bus type, colour and state; export.html renders them from a fixed
// studio and export.mjs writes the images. The apps only ever load the baked images, never WebGL.
// Units are metres. +x is the front, +y is up, -z is the kerb (door) side: Sri Lanka drives on the left.
(function () {
  const TRIM = { glass: '#26323D', tyre: '#22252B', hub: '#F4F6F8', dark: '#2B333B', tail: '#FF6B4A' };

  // light = roof cap, stripe, speed bars; main = body; deep = skirt, door frames, cap.
  const THEMES = {
    green: { light: '#6FD66F', main: '#3FB65A', deep: '#2A8F46', driverTop: '#F2707F', skin: '#C68B6A' },
    teal: { light: '#6DBFE8', main: '#3A9BC9', deep: '#1F5F85', driverTop: '#FFC83D', skin: '#8D5B43' },
    coral: { light: '#FF9DAF', main: '#F26B85', deep: '#C94B66', driverTop: '#FBF6EA', skin: '#EBC2A0' },
    yellow: { light: '#FFE27A', main: '#FFC83D', deep: '#D9A21F', driverTop: '#3A9BC9', skin: '#8D5B43' },
    orange: { light: '#FFB074', main: '#FF8A3D', deep: '#D96A1F', driverTop: '#2F4F9E', skin: '#C68B6A' },
    purple: { light: '#C3A6FF', main: '#8F6BE8', deep: '#6A47BF', driverTop: '#FFC83D', skin: '#EBC2A0' },
    navy: { light: '#5B7CC9', main: '#2F4F9E', deep: '#1E3470', driverTop: '#FF8A3D', skin: '#C68B6A' },
    red: { light: '#FF8A80', main: '#E8534A', deep: '#B83A33', driverTop: '#FBF6EA', skin: '#8D5B43' },
    mint: { light: '#B5F0D8', main: '#6FD4B0', deep: '#46A98A', driverTop: '#F26B85', skin: '#EBC2A0' },
    cream: { light: '#3A9BC9', main: '#FBF6EA', deep: '#CFC8B8', driverTop: '#F26B85', skin: '#C68B6A' }, // cream body, brand stripe
    off: { light: '#D3D8DE', main: '#B9C0C8', deep: '#8E97A1' }, // offline: no colour, no driver
  };
  // Add a brand colour with one line: THEMES.lime = tones('#9BD63F').
  function tones(main, extra) {
    const hsl = {}; new THREE.Color(main).getHSL(hsl);
    const at = (s, l) => `#${new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * s), Math.max(0, Math.min(1, hsl.l + l))).getHexString()}`;
    return { main, light: at(0.95, 0.15), deep: at(1, -0.14), driverTop: '#FBF6EA', skin: '#C68B6A', ...extra };
  }

  const TYPES = {
    bus: { theme: 'teal', length: 7, width: 2.5, height: 2.75, cab: 1.9, windows: 4, wheels: [-2, 2], doors: [0.375, -0.125], roof: 'vents' },
    coach: { theme: 'coral', length: 8.2, width: 2.5, height: 3.05, cab: 1.9, windows: 5, wheels: [-2.5, 2.6], doors: [0.4], roof: 'ac', luggage: true },
    minibus: { theme: 'mint', length: 5, width: 2.3, height: 2.45, cab: 1.7, windows: 3, wheels: [-1.4, 1.45], doors: [0.333], roof: 'none' },
    school: { theme: 'yellow', length: 6.2, width: 2.5, height: 2.6, cab: 1.9, windows: 4, wheels: [-1.8, 1.8], doors: [0.375], roof: 'beacon', stripe: TRIM.dark },
    decker: { theme: 'red', length: 7, width: 2.5, height: 4.1, cab: 1.9, windows: 4, decks: 2, wheels: [-2, 2], doors: [0.375, -0.125], roof: 'vents' },
  };

  const mats = new Map();
  function mat(hex, o) {
    const key = hex + JSON.stringify(o || {});
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.55, metalness: 0, ...o }));
    return mats.get(key);
  }
  // Rounded box: a rounded rectangle extruded with a round bevel, so every edge is soft.
  function rbox(w, h, d, r, material, at) {
    const b = Math.min(r, w / 2, h / 2, d / 2) / 2, c = Math.max(b, 0.001), x = w / 2 - b, y = h / 2 - b;
    const s = new THREE.Shape();
    s.moveTo(-x + c, -y); s.lineTo(x - c, -y); s.quadraticCurveTo(x, -y, x, -y + c); s.lineTo(x, y - c); s.quadraticCurveTo(x, y, x - c, y);
    s.lineTo(-x + c, y); s.quadraticCurveTo(-x, y, -x, y - c); s.lineTo(-x, -y + c); s.quadraticCurveTo(-x, -y, -x + c, -y);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - 2 * b, 0.001), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 5, curveSegments: 6 });
    g.center();
    const m = new THREE.Mesh(g, material);
    m.position.set(at[0], at[1], at[2]); m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  // state: 'running' (lights, speed bars, driver) | 'idle' (lights, driver) | 'parked' (lights off, no driver).
  // detail: false builds the simplified map-marker model.
  function buildBus(opts) {
    const o = { ...TYPES[opts.type || 'bus'], state: 'idle', detail: true, ...opts };
    const theme = typeof o.theme === 'string' ? THEMES[o.theme] : o.theme;
    const L = o.length, W = o.width, H = o.height, cab = o.cab;
    const g = new THREE.Group(), add = (...m) => g.add(...m);
    const paint = mat(theme.main), light = mat(theme.light), deep = mat(theme.deep), dark = mat(TRIM.dark, { roughness: 0.7 }), glassDark = mat(TRIM.glass, { roughness: 0.18 });
    const y0 = 0.45, top = y0 + H, front = L / 2, hz = W / 2, dash = y0 + 1.0, cabTop = Math.min(y0 + 2.33, top - 0.36), slab = top - cabTop;
    const rearLen = L - cab + 0.2, rearX = -L / 2 + rearLen / 2, cabX = front - cab / 2, openMid = (dash + cabTop) / 2, openH = cabTop - dash;

    // Body: a rear block, a cab base, a cab roof and two pillars, leaving an open cab for the driver.
    add(rbox(rearLen, H, W, 0.32, paint, [rearX, y0 + H / 2, 0]));
    add(rbox(cab, 1.0, W, 0.28, paint, [cabX, y0 + 0.5, 0]));
    add(rbox(cab, slab, W, 0.2, paint, [cabX, top - slab / 2, 0]));
    for (const z of [-1, 1]) add(rbox(0.14, openH + 0.2, 0.14, 0.06, paint, [front - 0.16, openMid, z * (hz - 0.13)]));
    add(rbox(L + 0.06, 0.5, W + 0.06, 0.2, deep, [0, y0 + 0.25, 0])); // skirt
    if (!o.luggage) add(rbox(L + 0.04, 0.2, W + 0.04, 0.06, o.stripe ? mat(o.stripe) : light, [0, y0 + 0.8, 0])); // stripe
    add(rbox(L - 0.7, 0.14, W - 0.5, 0.07, light, [-0.05, top + 0.04, 0])); // roof cap
    add(rbox(0.06, openH, W - 0.3, 0.02, mat('#1D242B', { roughness: 0.9 }), [front - cab + 0.03, openMid, 0])); // cab back wall

    // Window bands with body-colour pillars. A second deck adds a second band and a stripe between them.
    const bandLen = rearLen - 1.0, bandX = rearX - 0.05;
    const bands = o.decks === 2 ? [[y0 + 1.85, 0.95], [top - 0.85, 0.85]] : [[top - 0.95, 0.95]];
    for (const [by, bh] of bands) {
      add(rbox(bandLen, bh, W + 0.04, 0.12, glassDark, [bandX, by, 0]));
      for (let i = 1; i < o.windows; i++) add(rbox(0.14, bh + 0.05, W + 0.07, 0.04, paint, [bandX - bandLen / 2 + (bandLen * i) / o.windows, by, 0]));
    }
    if (o.decks === 2) {
      add(rbox(L + 0.04, 0.18, W + 0.04, 0.06, light, [0, y0 + 2.62, 0]));
      add(rbox(0.08, 0.8, W - 0.5, 0.06, glassDark, [front + 0.01, top - 0.85, 0])); // upper-deck front window
    }
    // Passenger doors on the kerb side: deep frame, two dark panes.
    for (const fr of o.doors) {
      const x = bandX + bandLen * fr;
      add(rbox(1.06, 2.0, 0.1, 0.05, deep, [x, y0 + 1.3, -(hz + 0.02)]));
      for (const d of [-0.25, 0.25]) add(rbox(0.42, 1.55, 0.14, 0.04, glassDark, [x + d, y0 + 1.42, -(hz + 0.02)]));
    }
    if (o.luggage) for (const z of [-1, 1]) for (const x of [-0.75, 0.75]) add(rbox(1.3, 0.5, 0.08, 0.05, deep, [x, y0 + 0.95, z * (hz + 0.02)]));

    // Cab glass: barely there on the hero, solid dark on the marker so the front reads from above.
    const glass = o.detail ? mat('#BFE3F2', { transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false }) : glassDark;
    const pane = (w, d, at) => { const m = rbox(w, openH, d, 0.02, glass, at); m.castShadow = false; return m; };
    add(pane(0.04, W - 0.3, [front - 0.07, openMid, 0]));
    for (const z of [-1, 1]) add(pane(cab - 0.5, 0.04, [cabX - 0.05, openMid, z * (hz - 0.05)]));

    // Fixed trim: bumper, blank route board, headlights, tail accents, wheels.
    const lit = o.state !== 'parked';
    add(rbox(0.25, 0.3, W + 0.1, 0.12, dark, [front - 0.05, y0 + 0.17, 0]));
    add(rbox(0.08, 0.26, W - 1.0, 0.05, dark, [front + 0.01, o.decks === 2 ? cabTop + 0.28 : top - slab / 2, 0]));
    const lamp = mat(lit ? '#FFFFFF' : '#C4CCD4', { emissive: new THREE.Color(lit ? '#FFFFFF' : '#000000'), emissiveIntensity: 0.9, roughness: 0.3 });
    for (const z of [-1, 1]) add(rbox(0.1, 0.18, 0.55, 0.08, lamp, [front + 0.01, y0 + 0.72, z * (hz - 0.45)]));
    const tail = mat(TRIM.tail, { emissive: new THREE.Color('#5A1206') });
    for (const z of [-1, 1]) add(rbox(0.3, 0.14, 0.06, 0.04, tail, [-front + 0.4, y0 + 0.72, z * (hz + 0.03)]));
    for (const x of o.wheels) for (const z of [-1, 1]) {
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 32), mat(TRIM.tyre, { roughness: 0.85 }));
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.46, 24), mat(TRIM.hub, { roughness: 0.4 }));
      for (const m of [tyre, hub]) { m.rotation.x = Math.PI / 2; m.position.set(x, 0.52, z * (hz - 0.12)); m.castShadow = true; add(m); }
    }

    if (!o.detail) { // marker: dark windscreen wraps onto the roof at the front, red bar at the rear
      add(rbox(0.75, 0.1, W - 0.3, 0.05, glassDark, [front - 0.5, top + 0.02, 0]));
      add(rbox(0.22, 0.1, W - 0.5, 0.05, tail, [-front + 0.22, top + 0.02, 0]));
      return g;
    }

    const black = mat('#1A1D21', { roughness: 0.5 });
    for (const z of [-1, 1]) add(rbox(0.14, 0.5, 0.26, 0.07, black, [front - 0.08, dash - 0.05, z * (hz + 0.27)]), rbox(0.08, 0.08, 0.34, 0.03, black, [front - 0.08, dash + 0.08, z * (hz + 0.1)]));
    if (o.roof === 'vents' || o.roof === 'beacon') for (const x of [-0.35, 0.2]) add(rbox(0.9, 0.14, 1.0, 0.06, light, [rearX + x * rearLen, top + 0.13, 0]));
    if (o.roof === 'ac') add(rbox(2.6, 0.28, 1.5, 0.12, light, [rearX, top + 0.2, 0]));
    if (o.roof === 'beacon') add(rbox(0.4, 0.22, 0.4, 0.09, mat('#E8534A', { emissive: new THREE.Color('#4A0E0A') }), [cabX - 0.2, top + 0.08, 0]));

    if (lit && theme.driverTop) { // driver (right-hand drive), far enough forward that the roof does not hide the head
      const dz = hz - 0.85, dx = cabX + 0.25;
      add(rbox(0.16, 1.0, 0.72, 0.07, dark, [dx - 0.44, dash + 0.35, dz]));
      const torso = new THREE.Mesh(new THREE.SphereGeometry(0.38, 28, 20), mat(theme.driverTop)); torso.scale.set(0.95, 1.2, 1.1); torso.position.set(dx, dash + 0.02, dz);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 28, 20), mat(theme.skin, { roughness: 0.65 })); head.position.set(dx + 0.03, dash + 0.56, dz);
      const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.268, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), deep); capTop.position.set(dx + 0.03, dash + 0.61, dz);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 10, 28), dark); wheel.rotation.set(0, Math.PI / 2, 0.35); wheel.position.set(dx + 0.46, dash + 0.1, dz);
      for (const m of [torso, head, capTop, wheel]) m.castShadow = true;
      add(torso, head, capTop, wheel, rbox(0.26, 0.05, 0.38, 0.02, deep, [dx + 0.27, dash + 0.62, dz]));
    }
    // Three speed bars trail from the rear on the kerb side, running pose only.
    if (o.state === 'running') for (const [len, y, end] of [[2.4, y0 + 2.0, -front + 1.3], [2.9, y0 + 1.5, -front + 0.9], [2.0, y0 + 1.0, -front + 1.2]]) add(rbox(len, 0.2, 0.2, 0.1, light, [end - len / 2, y, -(hz + 0.18)]));
    return g;
  }

  // A two-lane road with buses on it: [type, theme, x, lane] where lane -1 is the near (kerb-side) lane heading +x.
  function buildScene(list) {
    const g = new THREE.Group();
    const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 9.4), mat('#2C7FAB', { roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; g.add(road);
    for (let x = -90; x < 92; x += 3.6) { const dash = rbox(1.7, 0.03, 0.2, 0.01, mat('#FFFFFF', { roughness: 0.9 }), [x, 0.03, 0]); dash.castShadow = false; g.add(dash); }
    for (const [type, theme, x, lane] of list) {
      const bus = buildBus({ type, theme, state: 'idle' });
      bus.position.set(x, 0, lane * 2.35); if (lane > 0) bus.rotation.y = Math.PI;
      g.add(bus);
    }
    return g;
  }
  const SCENES = {
    login: [['bus', 'teal', 2, -1], ['minibus', 'mint', 10.5, -1], ['coach', 'coral', -7.5, 1]],
    register: [['decker', 'red', 2, -1], ['school', 'yellow', 10.8, -1], ['minibus', 'purple', -6.5, 1]],
    driver: [['bus', 'teal', 4.5, -1], ['minibus', 'orange', -5, 1]],
    admin: [['coach', 'navy', 1.5, -1], ['bus', 'teal', 11, -1], ['decker', 'red', -7.5, 1]],
  };

  // Fixed studio: one camera recipe and one light rig for every shot. Negative azimuth = seen from the kerb side;
  // the key light moves with the camera so the long side is always the lit one.
  function studio() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa6b2, 0.56));
    const fill = new THREE.DirectionalLight(0xffffff, 0.16); fill.position.set(10, 4, 2); scene.add(fill);
    const key = new THREE.DirectionalLight(0xffffff, 0.58);
    key.position.set(2.4, 10.4, 10.4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -0.0005;
    Object.assign(key.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 });
    scene.add(key);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.2 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    return function shoot(obj, { w, h, elevation = 26, azimuth = -46, distance = 26, target = [0, 1.5, 0], heading = 0, type = 'image/webp' }) {
      key.position.z = Math.sign(azimuth) * 10.4; fill.position.z = Math.sign(azimuth) * 2;
      obj.rotation.y = (heading * Math.PI) / 180; scene.add(obj);
      const cam = new THREE.PerspectiveCamera(20, w / h, 1, 200), e = (elevation * Math.PI) / 180, a = (azimuth * Math.PI) / 180;
      cam.position.set(target[0] + distance * Math.cos(e) * Math.cos(a), target[1] + distance * Math.sin(e), target[2] + distance * Math.cos(e) * Math.sin(a));
      cam.lookAt(target[0], target[1], target[2]);
      renderer.setSize(w, h, false); renderer.render(scene, cam);
      const url = renderer.domElement.toDataURL(type, 0.9);
      scene.remove(obj);
      return url;
    };
  }

  // Everything the apps use. Names here are the image keys that shared/vehicleShapes.js asks for.
  function manifest() {
    const hero = [];
    for (const theme of Object.keys(THEMES).filter((t) => t !== 'off')) for (const state of ['running', 'idle', 'parked']) hero.push({ name: `bus-${theme}-${state}`, type: 'bus', theme, state });
    hero.push({ name: 'bus-off', type: 'bus', theme: 'off', state: 'parked' });
    for (const type of Object.keys(TYPES).filter((t) => t !== 'bus')) for (const state of ['running', 'idle']) hero.push({ name: `${type}-${TYPES[type].theme}-${state}`, type, theme: TYPES[type].theme, state });
    return { hero, scenes: Object.keys(SCENES), markers: [0, 1, 2, 3, 4, 5, 6, 7] };
  }

  window.ClayBus = { THEMES, TYPES, SCENES, tones, buildBus, buildScene, studio, manifest };
})();
