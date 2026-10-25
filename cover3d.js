// === COVER 2.5D WEBTOON — bride & groom, kamera masuk ke Our Story ===
(function(){
  const cover = document.getElementById('cover');
  const art   = document.querySelector('#cover .art');
  const canvas= document.getElementById('cover3d');
  const src   = document.getElementById('coupleSrc');
  const fadeEl= document.getElementById('coverFade');
  if (!cover || !art || !canvas || !src || !window.THREE) return;

  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'low-power' });
  } catch(e){ return; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  const CAM_Z = 14;
  camera.position.set(0, 0, CAM_Z);

  const rnd = (a,b) => a + Math.random() * (b - a);
  const palette = [0xc9827d, 0x7d865e, 0xc98b6a, 0xb07a52, 0xd9a86a];

  function canvasTex(w,h,draw){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function softCircleTex(){
    return canvasTex(128,128,(g,w,h)=>{
      const grd = g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
      grd.addColorStop(0,'rgba(255,255,255,1)');
      grd.addColorStop(0.45,'rgba(255,255,255,.75)');
      grd.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=grd; g.fillRect(0,0,w,h);
    });
  }
  function heartTex(){
    return canvasTex(128,128,(g,w,h)=>{
      g.clearRect(0,0,w,h);
      g.save();
      g.translate(w/2, 34.4);
      g.scale(1.6,1.6);
      g.beginPath();
      g.moveTo(0,12);
      g.bezierCurveTo(-2,-2,-19,-5,-19,10);
      g.bezierCurveTo(-19,23,-4,31,0,42);
      g.bezierCurveTo(4,31,19,23,19,10);
      g.bezierCurveTo(19,-5,2,-2,0,12);
      g.closePath();
      g.fillStyle = '#c9566c';
      g.fill();
      g.restore();
    });
  }

  function sunTex(){
    return canvasTex(256,256,(g,w,h)=>{
      const cx = w/2, cy = h/2, r = w/2;
      g.clearRect(0,0,w,h);
      const halo = g.createRadialGradient(cx,cy,r*0.30,cx,cy,r);
      halo.addColorStop(0,'rgba(248,238,214,.95)');
      halo.addColorStop(0.6,'rgba(248,238,214,.5)');
      halo.addColorStop(1,'rgba(248,238,214,0)');
      g.fillStyle = halo; g.fillRect(0,0,w,h);
      const core = g.createRadialGradient(cx,cy,0,cx,cy,r*0.36);
      core.addColorStop(0,'rgba(252,247,232,1)');
      core.addColorStop(0.82,'rgba(249,240,218,.92)');
      core.addColorStop(1,'rgba(249,240,218,0)');
      g.fillStyle = core;
      g.beginPath(); g.arc(cx,cy,r*0.36,0,Math.PI*2); g.fill();
    });
  }

  // ---- SKY ----
  const skyTex = canvasTex(64,256,(g,w,h)=>{
    const grd = g.createLinearGradient(0,0,0,h);
    grd.addColorStop(0,'#dde0d0');
    grd.addColorStop(0.62,'#edd7bd');
    grd.addColorStop(1,'#ddc4a1');
    g.fillStyle = grd; g.fillRect(0,0,w,h);
  });
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 42),
    new THREE.MeshBasicMaterial({ map: skyTex })
  );
  sky.position.set(0, 0, -8);
  scene.add(sky);

  // ---- SUN ----
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8),
    new THREE.MeshBasicMaterial({ map: sunTex(), color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 })
  );
  sun.position.set(1.25, 2.45, -6);
  scene.add(sun);

  // ---- HILLS ----
  function hillTex(color){
    return canvasTex(1024,512,(g,w,h)=>{
      g.clearRect(0,0,w,h);
      g.fillStyle = color;
      g.beginPath();
      g.ellipse(w*0.5, h*1.02, w*0.62, h*0.66, 0, Math.PI, Math.PI*2);
      g.lineTo(w, h); g.lineTo(0, h);
      g.closePath(); g.fill();
    });
  }
  const hillFar = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 14),
    new THREE.MeshBasicMaterial({ map: hillTex('#9aa07f'), transparent: true, depthWrite: false })
  );
  hillFar.position.set(0, -3.4, -4);
  scene.add(hillFar);

  const hillNear = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 14),
    new THREE.MeshBasicMaterial({ map: hillTex('#6f7860'), transparent: true, depthWrite: false })
  );
  hillNear.position.set(0, -4.2, -2.2);
  scene.add(hillNear);

  // ---- COUPLE (SVG -> texture) ----
  function loadSvg(tex, onReady){
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  function svgToTexture(svgEl, onReady){
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '140');
    clone.setAttribute('height', '178');
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type:'image/svg+xml;charset=utf-8' }));
    const tex = new THREE.Texture();
    loadSvg(tex);
    const img = new Image();
    img.onload = () => {
      tex.image = img;
      tex.needsUpdate = true;
      URL.revokeObjectURL(url);
      onReady && onReady(tex);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    return tex;
  }

  const svgs = src.querySelectorAll('svg');
  function addCouple(svgEl, h, x, z, phase){
    if (!svgEl) return null;
    const geo = new THREE.PlaneGeometry(h * (140/178), h);
    const mat = new THREE.MeshBasicMaterial({ transparent:true, depthWrite:false, opacity:0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, -3.0 + h/2, z);
    mesh.visible = false;
    mesh.userData = { baseY: mesh.position.y, phase };
    scene.add(mesh);
    svgToTexture(svgEl, tex => {
      mat.map = tex;
      mat.needsUpdate = true;
      mesh.visible = true;
    });
    return mesh;
  }
  const groom = addCouple(svgs[0], 2.70, -1.22, 0.0, 0.4);
  const bride = addCouple(svgs[1], 2.85,  1.22, 0.2, 1.6);

  // ---- heart between ----
  const heart = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.58),
    new THREE.MeshBasicMaterial({ map: heartTex(), transparent:true, depthWrite:false, opacity:0 })
  );
  heart.position.set(0, -2.45, 0.6);
  scene.add(heart);

  // ---- petals ----
  const PN = 22;
  const pPos = new Float32Array(PN*3);
  const pCol = new Float32Array(PN*3);
  const pSpd = new Float32Array(PN);
  const pPh  = new Float32Array(PN);
  const col = new THREE.Color();
  for (let i=0;i<PN;i++){
    pPos[i*3]   = rnd(-6.5, 6.5);
    pPos[i*3+1] = rnd(-5.0, 5.0);
    pPos[i*3+2] = rnd(-3.0, 1.5);
    col.setHex(palette[(Math.random()*palette.length)|0]).lerp(new THREE.Color(0xf7f2e8), 0.15);
    pCol[i*3] = col.r; pCol[i*3+1] = col.g; pCol[i*3+2] = col.b;
    pSpd[i] = rnd(0.18, 0.5);
    pPh[i]  = rnd(0, Math.PI*2);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol,3));
  const pMat = new THREE.PointsMaterial({
    size:0.17, map: softCircleTex(), transparent:true, depthWrite:false,
    vertexColors:true, opacity:0, sizeAttenuation:true
  });
  const petals = new THREE.Points(pGeo, pMat);
  scene.add(petals);

  // ---- resize ----
  function resize(){
    const w = art.clientWidth || 1, h = art.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- pointer parallax ----
  const pointer = new THREE.Vector2(0,0);
  const target  = new THREE.Vector2(0,0);
  function onPointer(e){
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    target.x = (t.clientX / window.innerWidth) * 2 - 1;
    target.y = -((t.clientY / window.innerHeight) * 2 - 1);
  }
  window.addEventListener('pointermove', onPointer, { passive:true });
  window.addEventListener('touchmove', onPointer, { passive:true });

  // ---- intro / exit state ----
  const introStart = performance.now();
  let exiting = false, exitStart = 0;

  window.coverIntro = function(){
    if (exiting) return;
    exiting = true;
    exitStart = performance.now();
    if (reduceMotion && fadeEl) fadeEl.style.opacity = '1';
    else setTimeout(() => { if (fadeEl) fadeEl.style.opacity = '1'; }, 460);
  };

  const clock = new THREE.Clock();
  let lastT = 0;

  function loop(){
    if (cover.style.display === 'none') return;
    requestAnimationFrame(loop);

    const now = performance.now();
    const t = clock.getElapsedTime();
    const dt = Math.min(Math.max(t - lastT, 0), 0.05);
    lastT = t;

    let introP = Math.min((now - introStart) / 1400, 1);
    introP = 1 - Math.pow(1 - introP, 3);
    const alpha = reduceMotion ? 1 : introP;

    let ex = 0;
    if (exiting){
      ex = Math.min((now - exitStart) / 900, 1);
      ex = ex < 0.5 ? 4*ex*ex*ex : 1 - Math.pow(-2*ex + 2, 3)/2;
    }

    pointer.lerp(target, 0.06);
    const parX = reduceMotion ? 0 : pointer.x * 0.5;
    const parY = reduceMotion ? 0 : pointer.y * 0.32;

    camera.position.x = parX * (1 - ex);
    camera.position.y = parY * (1 - ex) + (-1.15) * ex;
    camera.position.z = CAM_Z + (reduceMotion ? 0 : (1 - introP) * 2.6) - 9.4 * ex;

    const lookY = -0.35 * (1 - ex) + (-2.35) * ex;
    camera.lookAt(0, lookY, 0);

    if (!reduceMotion){
      if (groom){
        groom.position.y = groom.userData.baseY + Math.sin(t*1.15 + groom.userData.phase) * 0.035;
        groom.rotation.z = Math.sin(t*0.85 + groom.userData.phase) * 0.02;
      }
      if (bride){
        bride.position.y = bride.userData.baseY + Math.sin(t*1.15 + bride.userData.phase) * 0.035;
        bride.rotation.z = Math.sin(t*0.85 + bride.userData.phase) * 0.02;
      }
      sun.scale.setScalar(1 + Math.sin(t*0.55) * 0.025);
      const hb = 1 + Math.sin(t*2.1) * 0.09;
      heart.scale.setScalar(hb);

      const arr = pGeo.attributes.position.array;
      for (let i=0;i<PN;i++){
        arr[i*3+1] -= pSpd[i] * dt;
        arr[i*3]   += Math.sin(t*0.5 + pPh[i]) * 0.0025;
        if (arr[i*3+1] < -5.6){
          arr[i*3+1] = 5.6;
          arr[i*3]   = rnd(-6.5, 6.5);
        }
      }
      pGeo.attributes.position.needsUpdate = true;
    }

    sun.material.opacity = alpha;
    if (groom) groom.material.opacity = alpha;
    if (bride) bride.material.opacity = alpha;
    heart.material.opacity = alpha * 0.95;
    pMat.opacity = alpha * 0.6;

    renderer.render(scene, camera);
  }
  loop();
})();
