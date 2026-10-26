/* 3D flower petals over the cover — Three.js */
(function () {
  const cover = document.getElementById('cover');
  const canvas = document.getElementById('petals3d');
  if (!cover || !canvas || !window.THREE) return;

  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  scene.add(new THREE.AmbientLight(0xfff3e4, 1.6));
  const key = new THREE.DirectionalLight(0xffe9cf, 0.95);
  key.position.set(4, 6, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd7dcc4, 0.5);
  rim.position.set(-6, -3, 5);
  scene.add(rim);

  const shape = new THREE.Shape();
  shape.moveTo(0, -0.14);
  shape.bezierCurveTo(0.075, -0.13, 0.12, 0.0, 0, 0.15);
  shape.bezierCurveTo(-0.12, 0.0, -0.075, -0.13, 0, -0.14);
  const geo = new THREE.ShapeGeometry(shape, 14);
  const pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i);
    pa.setZ(i, -(x * x) * 3.2);
  }
  geo.computeVertexNormals();

  const COLORS = [0xf9ecda, 0xf3d9ca, 0xe8c1ad, 0xdba98f];
  const mats = COLORS.map(c => new THREE.MeshStandardMaterial({
    color: c, side: THREE.DoubleSide, roughness: 0.9, metalness: 0,
    emissive: new THREE.Color(c).multiplyScalar(0.16)
  }));

  const rnd = (a, b) => a + Math.random() * (b - a);
  const bounds = { w: 6, h: 6 };
  const petals = [];
  const isSmall = () => window.innerWidth < 680;
  const target = { x: 0, y: 0 };

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    bounds.h = vh * 0.62;
    bounds.w = vh * camera.aspect * 0.62;
  }

  function spawn(p, randomY) {
    const z = rnd(-5, 2.2);
    p.position.set(rnd(-bounds.w, bounds.w), randomY ? rnd(-bounds.h, bounds.h) : bounds.h + 1.4, z);
    p.rotation.set(rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28));
  }

  function build() {
    const n = isSmall() ? 32 : 60;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mats[i % mats.length]);
      m.scale.setScalar(rnd(0.7, 1.3));
      m.userData = {
        vy: rnd(0.55, 1.15),
        drift: rnd(-0.18, 0.18),
        sway: rnd(0.25, 0.85),
        ph: rnd(0, 6.28),
        rx: rnd(-0.9, 0.9),
        ry: rnd(-1.1, 1.1),
        rz: rnd(-0.6, 0.6)
      };
      spawn(m, true);
      scene.add(m);
      petals.push(m);
    }
  }

  resize();
  build();

  window.addEventListener('resize', resize);

  if (!reduce) {
    cover.addEventListener('pointermove', e => {
      const r = cover.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }, { passive: true });
  }

  const clock = new THREE.Clock();
  let t = 0;
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (cover.style.display === 'none') { cancelAnimationFrame(raf); return; }

    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) {
      t += dt;
      for (let i = 0; i < petals.length; i++) {
        const m = petals[i];
        const u = m.userData;
        m.position.y -= u.vy * dt;
        m.position.x += (Math.sin(t * 0.7 + u.ph) * u.sway + u.drift) * dt;
        m.position.z += Math.cos(t * 0.45 + u.ph) * 0.05 * dt;
        m.rotation.x += u.rx * dt;
        m.rotation.y += u.ry * dt;
        m.rotation.z += u.rz * dt;
        if (m.position.y < -bounds.h - 1.4) spawn(m, false);
        if (m.position.x > bounds.w + 1.6) m.position.x = -bounds.w - 1.6;
        else if (m.position.x < -bounds.w - 1.6) m.position.x = bounds.w + 1.6;
      }
      camera.position.x += (target.x * 0.55 - camera.position.x) * 0.045;
      camera.position.y += (-target.y * 0.4 - camera.position.y) * 0.045;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  }

  frame();
})();
