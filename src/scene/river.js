import * as THREE from 'three';

/*
 * The Netravati at night, drawn in dots: a river that flows toward you between
 * two dotted banks, rain and the cursor rippling the water, and a dotted moon
 * above it with one small ball in orbit for each essay. Its light lies on the
 * water; pointing at an essay lights its ball and warms the reflection.
 */

const NIGHT = new THREE.Color('#05090b');
const INK = new THREE.Color('#dfeae4');
const SODIUM = new THREE.Color('#ff8a2a');

const dotFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.18, r));
  }
`;

const fieldVertex = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uStir;
  uniform float uScale;
  uniform vec3 uInk;
  uniform vec3 uSodium;
  uniform float uWarm;
  uniform vec4 uDrops[6]; // monsoon rain: x, z, time it landed, strength
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float side = abs(p.x);
    float bank = smoothstep(3.0, 7.5, side);

    // the hills rise away from the water, lower toward the horizon
    float hills = smoothstep(3.0, 13.0, side) * (1.4 + 1.1 * sin(p.z * 0.32 + sign(p.x) * 1.7) + 0.6 * sin(p.z * 0.85 + p.x * 0.45));
    hills += bank * 0.25 * sin(p.x * 1.7 + p.z * 1.3);

    // the current runs toward the viewer
    float t = uTime;
    float wave = 0.16 * sin(p.z * 1.1 - t * 2.2 + p.x * 0.35)
               + 0.09 * sin(p.z * 2.4 - t * 3.1 - p.x * 1.1)
               + 0.05 * sin(p.x * 2.8 + t * 1.2)
               + 0.22 * sin(p.z * 0.45 - t * 1.1) * smoothstep(-20.0, 2.0, p.z); // a long swell rolling in
    wave *= 1.0 - bank;

    float d = distance(p.xz, uMouse.xz);
    float ripple = uStir * 0.3 * sin(d * 4.2 - t * 6.0) * exp(-d * 0.55);

    // each drop sends one ring outward that fades as it widens
    for (int i = 0; i < 6; i++) {
      vec4 drop = uDrops[i];
      float age = t - drop.z;
      if (age < 0.0 || age > 3.0) continue;
      float r = distance(p.xz, drop.xy);
      float front = age * 2.2;
      ripple += drop.w * 0.22 * exp(-pow((r - front) * 2.6, 2.0)) * (1.0 - age / 3.0);
    }
    ripple *= 1.0 - bank;

    p.y += hills + wave + ripple;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float crest = clamp(0.45 + wave * 3.5 + ripple * 3.0, 0.0, 1.0);
    gl_PointSize = min(uScale * (1.0 + crest * 0.7) / -mv.z, uScale * 0.09);

    // the moon's light lies on the water as a long streak
    float streak = (1.0 - bank) * exp(-pow(p.x * 0.75, 2.0)) * smoothstep(-22.0, -1.0, p.z) * smoothstep(9.0, 2.0, p.z);
    streak *= 0.55 + 0.45 * sin(p.z * 3.1 - t * 2.0 + p.x * 2.0);

    vec3 c = mix(uInk * 0.38, uInk * 1.0, crest);
    c = mix(c, uInk * 0.42, bank * 0.6);
    vec3 light = mix(uInk * 1.15, uSodium, uWarm);
    vColor = mix(c, light, clamp(streak, 0.0, 1.0));

    float fog = smoothstep(6.0, 34.0, -mv.z);
    float near = smoothstep(2.5, 6.5, -mv.z); // dots at the viewer's feet fade out
    vAlpha = (1.0 - fog) * near * mix(0.95, 0.6, bank);
  }
`;

const moonVertex = /* glsl */ `
  attribute float seed;
  uniform float uTime;
  uniform float uScale;
  uniform float uGrow;
  uniform float uWarm;
  uniform vec3 uInk;
  uniform vec3 uSodium;
  uniform vec3 uLight; // direction of the light, in view space
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 n = normalize(position);
    float shimmer = 1.0 + 0.018 * sin(uTime * 1.4 + seed * 6.28);
    vec4 mv = modelViewMatrix * vec4(position * uGrow * shimmer, 1.0);
    gl_Position = projectionMatrix * mv;

    vec3 vn = normalize(normalMatrix * n);
    float lit = clamp(dot(vn, uLight), 0.0, 1.0);
    float facing = clamp(vn.z, 0.0, 1.0);
    gl_PointSize = uScale * (0.5 + lit * 0.65) / -mv.z;

    vColor = mix(uInk, mix(uInk, uSodium, 0.45), uWarm) * (0.22 + lit * 0.95);
    vAlpha = (0.12 + 0.88 * facing) * (0.3 + lit * 0.7);
  }
`;

const orbitVertex = /* glsl */ `
  attribute float index;
  uniform float uTime;
  uniform float uScale;
  uniform float uCount;
  uniform float uActive;
  uniform float uOn;
  uniform float uGrow;
  uniform vec3 uInk;
  uniform vec3 uSodium;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float a = index / uCount * 6.28318 + uTime * 0.22;
    float r = 1.95 * uGrow;
    vec3 p = vec3(cos(a) * r, 0.0, sin(a) * r);
    p = vec3(p.x, p.z * 0.42, p.z * 0.91); // the ring is tilted toward the viewer
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float on = (1.0 - step(0.5, abs(index - uActive))) * uOn;
    gl_PointSize = uScale * (2.3 + on * 2.2) / -mv.z;
    vColor = mix(uInk, uSodium, on);
    vAlpha = 0.8 + on * 0.2;
  }
`;

const ringVertex = /* glsl */ `
  uniform float uScale;
  uniform float uGrow;
  uniform vec3 uInk;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position * uGrow, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uScale * 0.45 / -mv.z;
    vColor = uInk;
    vAlpha = 0.35;
  }
`;

const dustVertex = /* glsl */ `
  attribute float seed;
  uniform float uTime;
  uniform float uScale;
  uniform vec3 uSodium;
  uniform vec3 uInk;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.18 + seed * 0.3), 7.0);
    p.x += sin(uTime * 0.5 + seed * 20.0) * 0.5;
    p.z += cos(uTime * 0.4 + seed * 13.0) * 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uScale * (0.6 + seed) / -mv.z;
    vColor = mix(uInk, uSodium, step(0.7, seed));
    vAlpha = smoothstep(0.0, 1.0, p.y) * smoothstep(7.0, 4.5, p.y) * 0.7;
  }
`;

function dots(geometry, vertexShader, uniforms) {
    return new THREE.Points(
        geometry,
        new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: dotFragment,
            uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
}

function riverField(cols, rows) {
    const positions = new Float32Array(cols * rows * 3);
    let k = 0;
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            positions[k++] = (i / (cols - 1) - 0.5) * 40;
            positions[k++] = 0;
            positions[k++] = (j / (rows - 1)) * -36 + 4;
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
}

// evenly spread dots over a sphere (a Fibonacci lattice)
function moonGeometry(count, radius) {
    const position = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const a = golden * i;
        position.set([Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius], i * 3);
        seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    return g;
}

function orbitGeometry(count) {
    const position = new Float32Array(count * 3);
    const index = new Float32Array(count);
    for (let i = 0; i < count; i++) index[i] = i;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('index', new THREE.BufferAttribute(index, 1));
    return g;
}

// the dotted path the balls travel
function ringGeometry(count, radius) {
    const position = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        position.set([x, z * 0.42, z * 0.91], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    return g;
}

function dustGeometry(count) {
    const position = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        position.set([(Math.random() - 0.5) * 22, Math.random() * 7, Math.random() * -26 + 6], i * 3);
        seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    return g;
}

export function createRiver(canvas, { entries = 1, still = false } = {}) {
    const small = window.innerWidth < 760;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.setClearColor(NIGHT, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
    const lookAt = new THREE.Vector3(0, 1.5, 0);

    const shared = { uTime: { value: 0 }, uScale: { value: 1 } };

    const fieldUniforms = {
        ...shared,
        uMouse: { value: new THREE.Vector3(0, 0, 100) },
        uDrops: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -10, 0)) },
        uStir: { value: 0 },
        uWarm: { value: 0 },
        uInk: { value: INK },
        uSodium: { value: SODIUM },
    };
    const field = dots(riverField(small ? 150 : 230, small ? 110 : 160), fieldVertex, fieldUniforms);
    scene.add(field);

    const dust = dots(dustGeometry(small ? 160 : 320), dustVertex, { ...shared, uInk: { value: INK }, uSodium: { value: SODIUM } });
    scene.add(dust);

    // the moon, its ring, and one ball per essay; newest essay is index 0 of the posts,
    // so ball i is essay (entries - 1 - i) counted from the oldest
    const grow = { uGrow: { value: still ? 1 : 0 } };
    const moon = new THREE.Group();
    const moonUniforms = {
        ...shared,
        ...grow,
        uWarm: { value: 0 },
        uInk: { value: INK },
        uSodium: { value: SODIUM },
        uLight: { value: new THREE.Vector3(-0.55, 0.45, 0.7).normalize() },
    };
    moon.add(dots(moonGeometry(small ? 1500 : 2400, 1.05), moonVertex, moonUniforms));
    moon.add(dots(ringGeometry(160, 1.95), ringVertex, { ...shared, ...grow, uInk: { value: INK } }));
    const orbitUniforms = {
        ...shared,
        ...grow,
        uCount: { value: Math.max(entries, 1) },
        uActive: { value: -1 },
        uOn: { value: 0 },
        uInk: { value: INK },
        uSodium: { value: SODIUM },
    };
    moon.add(dots(orbitGeometry(entries), orbitVertex, orbitUniforms));
    let moonY = 2.05;
    moon.position.set(0, moonY, -0.5);
    scene.add(moon);

    let active = null;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, moved: 0 };
    const raycaster = new THREE.Raycaster();
    const water = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();

    let baseY = 3.3;
    const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // narrow screens: step back so the log stays whole
        const narrow = w / h < 0.9;
        camera.fov = narrow ? 56 : 46;
        baseY = narrow ? 4.6 : 3.3;
        camera.position.set(0, baseY, narrow ? 15 : 9.5);
        // on phones look a little higher so the log sits in the gap above the log box
        lookAt.set(0, narrow ? 2.05 : 1.25, 0);
        // on wide screens the moon floats clear of the hills instead of rising behind them
        moonY = narrow ? 2.05 : 2.75;
        camera.updateProjectionMatrix();
        shared.uScale.value = renderer.getPixelRatio() * h * (narrow ? 0.05 : 0.042);
    };

    const onPointer = e => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
        pointer.moved = 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // stop drawing while the tab is in the background
    const onVisibility = () => api.setPaused(document.hidden || pausedByPage);
    document.addEventListener('visibilitychange', onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const clock = new THREE.Clock();
    let raf = 0;
    let paused = false;
    let nextDrop = 0.6;
    let dropIndex = 0;
    // with reduced motion the river still breathes, slowly, and it doesn't rain
    const speed = still ? 0.25 : 1;

    const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = (shared.uTime.value += dt * speed);

        if (!still && t > nextDrop) {
            const z = -1 - Math.random() * 14;
            fieldUniforms.uDrops.value[dropIndex].set((Math.random() - 0.5) * 5.5, z, t, 0.6 + Math.random() * 0.6);
            dropIndex = (dropIndex + 1) % 6;
            nextDrop = t + 0.25 + Math.random() * 0.6;
        }

        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        // a slow drift of its own, so the view is never still even when the mouse is
        camera.position.x = pointer.x * 0.7 + Math.sin(t * 0.13) * 0.9;
        camera.position.y = baseY + Math.sin(t * 0.21) * 0.15;
        camera.lookAt(lookAt.x + pointer.x * 0.2, lookAt.y + pointer.y * 0.15, lookAt.z);

        raycaster.setFromCamera({ x: pointer.tx, y: pointer.ty }, camera);
        if (raycaster.ray.intersectPlane(water, hit)) fieldUniforms.uMouse.value.lerp(hit, 0.2);
        fieldUniforms.uStir.value += (pointer.moved - fieldUniforms.uStir.value) * 0.04;
        pointer.moved *= 0.985;

        // the moon turns slowly, bobs, and grows in on load
        grow.uGrow.value += (1 - grow.uGrow.value) * (still ? 1 : 0.035);
        moon.rotation.y = t * 0.08 + pointer.x * 0.2;
        moon.position.y = moonY + Math.sin(t * 0.6) * 0.06;

        const on = active !== null ? 1 : 0;
        if (active !== null) orbitUniforms.uActive.value = active;
        orbitUniforms.uOn.value += (on - orbitUniforms.uOn.value) * 0.1;
        moonUniforms.uWarm.value += (on - moonUniforms.uWarm.value) * 0.06;
        fieldUniforms.uWarm.value += (on - fieldUniforms.uWarm.value) * 0.06;

        renderer.render(scene, camera);
        raf = paused ? 0 : requestAnimationFrame(frame);
    };
    frame();

    let pausedByPage = false;
    const api = {
        setActive(index) {
            active = index;
        },
        setPaused(value, fromPage = false) {
            if (fromPage) pausedByPage = value;
            paused = value || document.hidden;
            if (!paused && !raf) {
                clock.getDelta();
                raf = requestAnimationFrame(frame);
            }
        },
        dispose() {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('pointermove', onPointer);
            document.removeEventListener('visibilitychange', onVisibility);
            scene.traverse(o => {
                o.geometry?.dispose();
                o.material?.dispose();
            });
            renderer.dispose();
        },
    };
    return api;
}
