// === Cover 3D — Three.js floating petals/hearts (earth tone) ===
(function(){
  const cover = document.getElementById('cover');
  const canvas = document.getElementById('cover3d');
  if (!cover || !canvas || !window.THREE) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'low-power' });
  } catch(e){ return; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const group = new THREE.Group();
  scene.add(group);

  // ---- atlas: soft bokeh circle + heart ----
  function makeAtlas(){
    const S = 128;
    const c = document.createElement('canvas');
    c.width = S * 2; c.height = S;
    const g = c.getContext('2d');

    const grd = g.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.5, 'rgba(255,255,255,.82)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(S/2, S/2, S/2, 0, Math.PI*2); g.fill();

    g.save();
    const s = S / 64;
    g.translate(S + S/2, S/2 - 18.5 * s);
    g.scale(s, s);
    g.beginPath();
    g.moveTo(0, 12);
    g.bezierCurveTo(-2, -2, -19, -5, -19, 10);
    g.bezierCurveTo(-19, 23, -4, 31, 0, 42);
    g.bezierCurveTo(4, 31, 19, 23, 19, 10);
    g.bezierCurveTo(19, -5, 2, -2, 0, 12);
    g.closePath();
    g.fillStyle = 'rgba(255,255,255,1)';
    g.fill();
    g.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  const COUNT  = window.innerWidth < 720 ? 78 : 150;
  const HEARTS = Math.round(COUNT * 0.24);

  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);
  const phases    = new Float32Array(COUNT);
  const atlasVel  = new Float32Array(COUNT);
  const alphas    = new Float32Array(COUNT);

  const palette = [0xb07a52, 0x7d865e, 0xc98b6a, 0xa05636, 0xd9a86a, 0x8f7f5a];
  const cream = new THREE.Color(0xf7f2e8);
  const col = new THREE.Color();
  const rnd = (a,b) => a + Math.random() * (b - a);

  for (let i = 0; i < COUNT; i++){
    const heart = i < HEARTS;
    const bokeh = !heart && i % 9 === 0;
    positions[i*3]     = rnd(-17, 17);
    positions[i*3 + 1] = rnd(-11, 11);
    positions[i*3 + 2] = rnd(-9, 5);

    col.setHex(palette[(Math.random() * palette.length) | 0]);
    col.lerp(cream, heart ? 0.10 : 0.20);
    colors[i*3]     = col.r;
    colors[i*3 + 1] = col.g;
    colors[i*3 + 2] = col.b;

    sizes[i]    = heart ? rnd(0.26, 0.44) : bokeh ? rnd(0.45, 0.78) : rnd(0.07, 0.19);
    alphas[i]   = heart ? 1.0 : bokeh ? 0.32 : 0.88;
    phases[i]   = rnd(0, Math.PI * 2);
    atlasVel[i] = heart ? 0.5 : 0.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aAtlas',   new THREE.BufferAttribute(atlasVel, 1));
  geo.setAttribute('aAlpha',   new THREE.BufferAttribute(alphas, 1));

  const uniforms = {
    uTime:    { value: 0 },
    uTex:     { value: makeAtlas() },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uHeight:  { value: 800 }
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute float aAtlas;
      attribute float aAlpha;
      attribute vec3 aColor;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uHeight;
      varying vec3 vColor;
      varying float vAtlas;
      varying float vAlpha;
      varying float vTwinkle;
      varying float vAlphaBase;
      void main(){
        vec3 p = position;
        float t = uTime;
        p.x += sin(t*0.35 + aPhase*1.7)*0.45 + cos(t*0.18 + aPhase)*0.22;
        p.y += cos(t*0.30 + aPhase*1.3)*0.50 + sin(t*0.15 + aPhase*0.7)*0.28;
        p.z += sin(t*0.22 + aPhase)*0.25;
        p.x += uPointer.x * (0.75 + (p.z + 9.0)*0.05);
        p.y += uPointer.y * (0.55 + (p.z + 9.0)*0.04);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (uHeight / max(-mv.z, 0.1));
        gl_Position = projectionMatrix * mv;

        vColor   = aColor;
        vAtlas   = aAtlas;
        vAlpha   = smoothstep(-20.0, -6.0, mv.z);
        vTwinkle = 0.78 + 0.22 * sin(uTime*0.9 + aPhase*4.0);
        vAlphaBase = aAlpha;
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D uTex;
      varying vec3 vColor;
      varying float vAtlas;
      varying float vAlpha;
      varying float vTwinkle;
      varying float vAlphaBase;
      void main(){
        vec2 uv = vec2(gl_PointCoord.x*0.5 + vAtlas, gl_PointCoord.y);
        vec4 tx = texture2D(uTex, uv);
        if (tx.a < 0.03) discard;
        gl_FragColor = vec4(vColor, tx.a * vAlpha * vTwinkle * vAlphaBase);
      }
    `
  });

  group.add(new THREE.Points(geo, mat));

  // pointer parallax
  const pointer = new THREE.Vector2(0, 0);
  const target  = new THREE.Vector2(0, 0);
  function onPointer(e){
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    target.x = (t.clientX / window.innerWidth) * 2 - 1;
    target.y = -((t.clientY / window.innerHeight) * 2 - 1);
  }
  window.addEventListener('pointermove', onPointer, { passive:true });
  window.addEventListener('touchmove',   onPointer, { passive:true });

  function resize(){
    const w = cover.clientWidth  || window.innerWidth;
    const h = cover.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    uniforms.uHeight.value = h * renderer.getPixelRatio();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let running = true;

  // pause saat cover sudah dibuka / tak terlihat
  if ('IntersectionObserver' in window){
    new IntersectionObserver(cfg => {
      for (const en of cfg) running = en.isIntersecting;
    }, { threshold: 0.01 }).observe(cover);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden && !cover.classList.contains('buka');
  });

  function renderFrame(){
    uniforms.uTime.value = clock.elapsedTime;
    pointer.lerp(target, 0.05);
    uniforms.uPointer.value.set(pointer.x * 1.5, pointer.y * 1.1);
    group.rotation.y = Math.sin(clock.elapsedTime*0.12)*0.08 + pointer.x*0.10;
    group.rotation.x = Math.cos(clock.elapsedTime*0.10)*0.05 - pointer.y*0.06;
    renderer.render(scene, camera);
  }

  if (reduceMotion){
    uniforms.uTime.value = 8.0;
    renderer.render(scene, camera);
    window.addEventListener('resize', () => { resize(); renderer.render(scene, camera); });
    return;
  }

  function loop(){
    requestAnimationFrame(loop);
    if (!running || cover.classList.contains('buka')) return;
    clock.getDelta();
    renderFrame();
  }
  loop();
})();
