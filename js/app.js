// Parallax + GSAP reveal (hardened / optimized)
// Wrap everything to avoid leaking globals
(() => {
  // --- Feature flags / helpers ---
  const RMM = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // --- Parallax state ---
  const parallaxEls = $$('.parallax');
  // Cache static per-element data so we don't hit layout each frame
  const cache = parallaxEls.map(el => ({
    el,
    // numeric speeds with sane fallbacks
    sx: toNum(el.dataset.speedx, 0),
    sy: toNum(el.dataset.speedy, toNum(el.dataset.speedx, 0)),
    sz: toNum(el.dataset.speedz, 0),
    // measured each (debounced) resize
    left: 0,
    // 1 if left-half, -1 if right-half (recomputed on resize)
    side: 1,
  }));

  // Cursor state (centered around viewport midpoint)
  const state = {
    x: 0,
    y: 0,
    cursorX: 0, // absolute clientX for z calc
    screenScale: 1,
    animationsComplete: false,
    needsUpdate: true, // first frame
    rafId: null,
  };

  // --- Sizing / scale ---
  function calculateScreenScale(width = window.innerWidth) {
    // Keep numbers mild to avoid pixel snapping on dense screens
    if (width >= 1920) return 1.2; // Large screens
    if (width >= 1440) return 0.95; // Desktop
    if (width >= 1024) return 0.875; // Laptop
    if (width >= 768)  return 0.85; // Tablet
    return 0.8; // Mobile
  }
  state.screenScale = calculateScreenScale();

  // Measure left positions without forcing style reads per frame
  function measureParallax() {
    const halfW = window.innerWidth / 2;
    cache.forEach(c => {
      const rect = c.el.getBoundingClientRect();
      // left relative to viewport; for stability in z we use this
      c.left = rect.left + window.scrollX; // guard scroll offset for future-proofing
      c.side = rect.left < halfW ? 1 : -1;
      // Hint to the browser this element will transform often
      c.el.style.willChange = 'transform';
    });
  }
  measureParallax();

  // Debounced resize using rAF (no timers)
  let resizeTicking = false;
  window.addEventListener('resize', () => {
    if (resizeTicking) return;
    resizeTicking = true;
    requestAnimationFrame(() => {
      resizeTicking = false;
      state.screenScale = calculateScreenScale();
      measureParallax();
      // after a resize, refresh once regardless of motion setting
      state.needsUpdate = true;
      updateFrame();
    });
  }, { passive: true });

  // --- Parallax update loop ---
  function applyParallax() {
    if (RMM) return;
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    // Build transforms per element without additional style reads
    for (const c of cache) {
      const { el, sx, sy, sz, left, side } = c;

      // Skip if element is currently being animated by GSAP
      if (!state.animationsComplete && el.classList.contains('gsap-animating')) {
        continue;
      }

      // translate relative to screen center
      const tx = -(state.x * sx);
      const ty = (state.y * sy);

      // depth parallax: how far the cursor is from the element's left
      // Use absolute cursorX minus measured left edge for stable z
      const zValue = (state.cursorX - left) * side * sz;

      // Compose transforms in a stable order:
      // perspective should live on a parent in CSS ideally; if kept here,
      // put it first to avoid unexpected scale interactions.
      // translate(-50%, -50%) preserves your centering.
      el.style.transform =
        `perspective(2300px) translateZ(${zValue}px) translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${state.screenScale})`;
    }
  }

  function updateFrame() {
    if (!state.needsUpdate) return;
    state.needsUpdate = false;
    applyParallax();
  }

  // Update parallax based on bird flock center position
  window.updateParallaxFromBirds = function(flockCenterX, flockCenterY) {
    // Convert bird canvas coordinates to screen coordinates
    // Birds are centered around canvas center, we need to translate to parallax coordinates
    state.cursorX = (window.innerWidth / 2) + flockCenterX;
    state.x = flockCenterX;
    state.y = -flockCenterY; // Invert Y since bird canvas is flipped
    state.needsUpdate = true;
    // Coalesce multiple updates in same frame
    if (state.rafId == null) {
      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        updateFrame();
      });
    }
  };

  // Initialize parallax with birds centered (x=0, y=0)
  state.cursorX = window.innerWidth / 2;
  state.x = 0;
  state.y = 0;
  state.needsUpdate = true;
  updateFrame();

  // Pause parallax work when tab hidden (saves battery/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Re-measure in case layout changed while hidden
      measureParallax();
      state.needsUpdate = true;
      updateFrame();
    }
  });

  // --- GSAP Reveal Animation (guarded & conflict-free) ---
  // Important: set transforms with GSAP on *different* properties than runtime parallax,
  // or set them first and then let parallax fully control `transform`.
  // Here we ONLY animate opacity/position/scale before enabling parallax.
  if (hasGSAP) {
    window.addEventListener('load', () => {
      const gs = window.gsap;

      // Pre-state (no transform centering changes here besides scale/pos)
      const sets = [
        ['.ui-overlay', { opacity: 0 }],
        ['.bg-img', { opacity: 0 }],
        ['#canv', { opacity: 0 }],
        ['.water', { opacity: .5, y: 200 }],
        ['.mountain-0', { opacity: 0, y: 1600 }],
        ['.mountain-3', { opacity: 0, y: 600 }],
        ['.mountain-4', { opacity: 0, y: 200 }],
        ['.mountain-5', { opacity: 0, y: 1200 }],
        ['.mountain-1', { opacity: 0, x: -500 }],
        ['.mountain-2', { opacity: 0, x: 500 }],
        ['.logo', { opacity: 0, scale: 0 }],
        ['.text', { opacity: 0, scale: 0.5, y: 50 }],
        ['.shine-2', { opacity: 0 }],
        ['.fog-0', { opacity: 0 }],
        ['.fog-1', { opacity: 0 }],
        ['.fog-2', { opacity: 0 }],
        ['.fog-4', { opacity: 0 }],
        ['.fog-water', { opacity: 0 }],
        ['.fog-fg', { opacity: 0 }],
        ['.fg-img', { opacity: 0, scale: 2 }],
        ['.fg-img-2', { opacity: 0, scale: 2 }],
        ['.fog-img', { opacity: 0, scale: 2 }],
        ['.fog-img-2', { opacity: 0, scale: 2 }],
      ];
      sets.forEach(([sel, conf]) => gs.set(sel, conf));

      // Mark elements that will be animated by GSAP
      const gsapElements = ['.bg-img', '.water', '.mountain-4', '.mountain-3', '.mountain-2',
                            '.mountain-5', '.mountain-1', '.mountain-0', '.shine-2', '.fog-4',
                            '.fog-2', '.fog-1', '.fog-0', '.logo', '.text', '.fog-water',
                            '.fog-fg', '.fg-img-2', '.fg-img', '.fog-img', '.fog-img-2'];

      gsapElements.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.classList.add('gsap-animating');
      });

      const tl = gs.timeline({ defaults: { ease: 'power2.inOut' } });

      tl.to('.bg-img', {
          opacity: 1,
          duration: 1.8,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.bg-img')?.classList.remove('gsap-animating'); }
        }, 1)
        .to('.water', {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => { document.querySelector('.water')?.classList.remove('gsap-animating'); }
        }, 1.2)
        .to('#canv', {
          opacity: 1,
          duration: 0.8,
          ease: 'power1.inOut',
          onComplete: () => {
            // Start birds after canvas fades in
            if (window.startBirdAnimation) {
              window.startBirdAnimation();
            }
          }
        }, 2.7)
        .to('.mountain-4', {
          opacity: 1,
          y: 0,
          duration: 1.2,
          onComplete: () => { document.querySelector('.mountain-4')?.classList.remove('gsap-animating'); }
        }, 1.5)
        .to('.mountain-3', {
          opacity: 1,
          y: 0,
          duration: 1.3,
          onComplete: () => { document.querySelector('.mountain-3')?.classList.remove('gsap-animating'); }
        }, 1.7)
        .to('.mountain-2', {
          opacity: 1,
          x: 0,
          duration: 3,
          onComplete: () => { document.querySelector('.mountain-2')?.classList.remove('gsap-animating'); }
        }, 1.8)
        .to('.mountain-5', {
          opacity: 1,
          y: 0,
          duration: 1.4,
          onComplete: () => { document.querySelector('.mountain-5')?.classList.remove('gsap-animating'); }
        }, 1.9)
        .to('.mountain-1', {
          opacity: 1,
          x: 0,
          duration: 3,
          onComplete: () => { document.querySelector('.mountain-1')?.classList.remove('gsap-animating'); }
        }, 2)
        .to('.mountain-0', {
          opacity: 1,
          y: 0,
          duration: 1.5,
          onComplete: () => { document.querySelector('.mountain-0')?.classList.remove('gsap-animating'); }
        }, 2.3)
        .to('.shine-2', {
          opacity: 1,
          duration: 1.5,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.shine-2')?.classList.remove('gsap-animating'); }
        }, 2)
        .to('.fog-4', {
          opacity: 1,
          duration: 1.2,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.fog-4')?.classList.remove('gsap-animating'); }
        }, 2.1)
        .to('.fog-2', {
          opacity: 1,
          duration: 1.2,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.fog-2')?.classList.remove('gsap-animating'); }
        }, 2.2)
        .to('.fog-1', {
          opacity: 1,
          duration: 1.2,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.fog-1')?.classList.remove('gsap-animating'); }
        }, 2.4)
        .to('.fog-0', {
          opacity: 1,
          duration: 1.2,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.fog-0')?.classList.remove('gsap-animating'); }
        }, 2.8)
        .to('.logo', {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: 'back.out(1.2)',
          onComplete: () => { document.querySelector('.logo')?.classList.remove('gsap-animating'); }
        }, 3)
        .to('.text', {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: 'back.out(1.1)',
          onComplete: () => { document.querySelector('.text')?.classList.remove('gsap-animating'); }
        }, 3.2)
        .to('.fog-water', {
          opacity: 1,
          duration: 1.3,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.fog-water')?.classList.remove('gsap-animating'); }
        }, 3.4)
        .to('.fog-fg', {
          opacity: 1,
          duration: 1.3,
          ease: 'power1.inOut',
          onComplete: () => { document.querySelector('.fog-fg')?.classList.remove('gsap-animating'); }
        }, 3.6)
        .to('.fg-img-2', {
          opacity: 1,
          scale: 1,
          duration: 2.5,
          onComplete: () => { document.querySelector('.fg-img-2')?.classList.remove('gsap-animating'); }
        }, 3.8)
        .to('.fg-img', {
          opacity: 1,
          scale: 1,
          duration: 2.5,
          onComplete: () => { document.querySelector('.fg-img')?.classList.remove('gsap-animating'); }
        }, 4)
        .to('.fog-img', {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          onComplete: () => { document.querySelector('.fog-img')?.classList.remove('gsap-animating'); }
        }, 4.2)
        .to('.fog-img-2', {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          onComplete: () => { document.querySelector('.fog-img-2')?.classList.remove('gsap-animating'); }
        }, 4.4)
        .to('.ui-overlay', {
          opacity: 1,
          duration: 1.5,
          ease: 'power1.inOut',
          onComplete: () => {
            // Mark animations as complete
            parallaxEls.forEach(el => el.classList.add('animated'));
            state.animationsComplete = true;
            state.needsUpdate = true;
            updateFrame();

            // Start leaf animation after reveal completes
            if (window.startLeafAnimation) {
              window.startLeafAnimation();
            }
          }
        }, 4.6);
    });
  } else {
    // If GSAP not present, enable parallax right away
    state.animationsComplete = true;
    state.needsUpdate = true;
    updateFrame();
  }

  // --- UI Interactions (defensively coded) ---
  document.addEventListener('DOMContentLoaded', () => {
    const sideMenu = $('.side-menu');
    const menuToggleBtn = $('.menu-toggle-btn');
    if (menuToggleBtn && sideMenu) {
      menuToggleBtn.addEventListener('click', () => {
        menuToggleBtn.classList.toggle('active');
        sideMenu.classList.toggle('active');
      });
    }

    const sideMenuItems = $$('.side-menu-item');
    if (sideMenu && sideMenuItems.length) {
      sideMenuItems.forEach(item => {
        item.addEventListener('click', () => {
          sideMenu.classList.remove('active');
          menuToggleBtn?.classList.remove('active');
        });
      });
    }

    const uiToggleBtn = $('.ui-toggle-btn');
    const uiOverlay = $('.ui-overlay');
    if (uiToggleBtn && uiOverlay) {
      uiToggleBtn.addEventListener('click', () => {
        uiToggleBtn.classList.toggle('hidden');
        uiOverlay.classList.toggle('hidden');
      });
    }

    const watchBtn = $('.watch-btn');
    watchBtn?.addEventListener('click', () => {
      // Hook your player logic here
      console.log('Watch Movie clicked');
    });

    const discoverBtn = $('.discover-btn');
    discoverBtn?.addEventListener('click', () => {
      console.log('Discover clicked');
    });

    // Progress bar
    const progressBar = $('.page-progress-bar');
    const navItems = $$('.nav-item');
    const totalPages = 4;

    const updateProgress = (pageNumber) => {
      if (!progressBar) return;
      const percentage = Math.max(0, Math.min(100, (pageNumber / totalPages) * 100));
      progressBar.style.height = `${percentage}%`;
      progressBar.ariaValueNow = String(Math.round(percentage));
    };

    navItems.forEach((item, index) => {
      const link = item.querySelector('a');
      if (!link) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        updateProgress(index + 1);
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          // Optional: programmatic navigation / scrollIntoView here
          console.log('Navigating to:', href);
        }
      });
    });

    updateProgress(1);
  });
})();


var Bird = {
  def: function(n, m, s) {
    if (m) this.e(n.prototype, m);
    if (s) this.e(n, s);
    return n;
  },
  e: function(o, p) {
    for (prop in p) o[prop] = p[prop];
    return o;
  },
  v: [
    [5, 0, 0],
    [-5, -2, 1],
    [-5, 0, 0],
    [-5, -2, -1],
    [0, 2, -6],
    [0, 2, 6],
    [2, 0, 0],
    [-3, 0, 0]
  ],
  beak: [
    [0, 1, 2],
    [4, 7, 6],
    [5, 6, 7]
  ],
  L: null,
  V: {
    x: 0,
    y: 0,
    z: 5000
  }
}
Bird.obj = Bird.def(
  function() {
    this.vtr = new Bird.Vtr(),
      this.accel, this.width = 600, this.height = 600, this.depth = 300, this.ept, this.area = 200,
      this.msp = 3, this.mfrc = 0.09, this.coll = false;
    this.pos = new Bird.Vtr();
    this.vel = new Bird.Vtr();
    this.accel = new Bird.Vtr();
  }, {

    _coll: function(value) {
      this.coll = value;
    },
    param: function(w, h, dth) {
      this.width = w;
      this.height = h;
      this.depth = dth;
    },
    run: function(b) {
      if (this.coll) {
        this.vtr.set(-this.width, this.pos.y, this.pos.z);
        this.vtr = this.detect(this.vtr);
        this.vtr.scale(5);
        this.accel.add(this.vtr);
        this.vtr.set(this.width, this.pos.y, this.pos.z);
        this.vtr = this.detect(this.vtr);
        this.vtr.scale(5);
        this.accel.add(this.vtr);
        this.vtr.set(this.pos.x, -this.height, this.pos.z);
        this.vtr = this.detect(this.vtr);
        this.vtr.scale(5);
        this.accel.add(this.vtr);
        this.vtr.set(this.pos.x, this.height, this.pos.z);
        this.vtr = this.detect(this.vtr);
        this.vtr.scale(5);
        this.accel.add(this.vtr);
        this.vtr.set(this.pos.x, this.pos.y, -this.depth);
        this.vtr = this.detect(this.vtr);
        this.vtr.scale(5);
        this.accel.add(this.vtr);
        this.vtr.set(this.pos.x, this.pos.y, this.depth);
        this.vtr = this.detect(this.vtr);
        this.vtr.scale(5);
        this.accel.add(this.vtr);
      }
      if (Math.random() > 0.5) {
        this.fly(b);
      }
      this.move();
    },
    fly: function(b) {
      // Only follow mouse if it's inside the canvas
      if (this.mouseInside && this.mouseInside() && this.mouseTarget) {
        this.accel.add(this.meet(this.mouseTarget, 0.03));
      }
      this.accel.add(this.line(b));
      this.accel.add(this.togeth(b));
      this.accel.add(this.apart(b));
    },
    move: function() {
      this.vel.add(this.accel);
      var l = this.vel.len();
      if (l > this.msp) {
        this.vel.lowscale(l / this.msp);
      }
      this.pos.add(this.vel);
      this.accel.set(0, 0, 0);
    },
    detect: function(pt) {
      var dir = new Bird.Vtr();
      dir.copy(this.pos);
      dir.sub(pt);
      dir.scale(1 / this.pos.dsq(pt));
      return dir;
    },
    rep: function(pt) {
      var dist = this.pos.dst(pt);if (dist < 150) {
        var dir = new Bird.Vtr();
        dir.subv(this.pos, pt);
        dir.scale(0.5 / dist);
        this.accel.add(dir);
      }
    },
    meet: function(pt, amt) {
      var dir = new Bird.Vtr();
      dir.subv(pt, this.pos);
      dir.scale(amt);
      return dir;
    },
    line: function(b) {
      var _b, totvel = new Bird.Vtr(),
        cnt = 0;
      for (var i = 0, il = b.length; i < il; i++) {
        if (Math.random() > 0.6) continue;
        _b = b[i];
        var dist = _b.pos.dst(this.pos);
        if (dist > 0 && dist <= this.area) {
          totvel.add(_b.vel);
          cnt++;
        }
      }
      if (cnt > 0) {
        totvel.lowscale(cnt);
        var v = totvel.len();
        if (v > this.mfrc) {
          totvel.lowscale( v / this.mfrc);
        }
      }
      return totvel;
    },
    togeth: function(b) {
      var _b, dist,
        plus = new Bird.Vtr(),
        dir = new Bird.Vtr(),
        cnt = 0;
      for (var i = 0, il = b.length; i < il; i++) {
        if (Math.random() > 0.6) continue;
        _b = b[i];
        dist = _b.pos.dst(this.pos);
        if (dist > 0 && dist <= this.area) {
          plus.add(_b.pos);
          cnt++;
        }
      }
      if (cnt > 0) {
        plus.lowscale(cnt);
      }
      dir.subv(plus, this.pos);
      var l = dir.len();
      if (l > this.mfrc) {
        dir.lowscale(l / this.mfrc);
      }
      return dir;
    },
    apart: function(b) {
      var _b, dist,
        plus = new Bird.Vtr(),
        rep = new Bird.Vtr();
      for (var i = 0, il = b.length; i < il; i++) {
        if (Math.random() > 0.6) continue;
        _b = b[i];
        dist = _b.pos.dst(this.pos);
        if (dist > 0 && dist <= this.area) {
          rep.subv(this.pos, _b.pos);
          rep.level();
          rep.lowscale(dist);
          plus.add(rep);
        }
      }
      return plus;
    }
  }
);
Bird.Build = Bird.def(
  function() {
    this.base = 0, this.left = 1, this.right = 2;
    this.pos = new Bird.Vtr();
    this.rot = new Bird.Vtr();
    this.bbase = this.tri(this.base);
    this.leftwing = this.tri(this.left);
    this.rightwing = this.tri(this.right);
  }, {
    matrix: function() {
      this.bbase.vtx();
      this.leftwing.vtx();
      this.rightwing.vtx();
      this.leftwing.wingY(this.wY);
      this.rightwing.wingY(this.wY);
      this.bbase.rotY(this.rot.y);
      this.bbase.rotZ(this.rot.z);
      this.leftwing.rotY(this.rot.y);
      this.leftwing.rotZ(this.rot.z);
      this.rightwing.rotY(this.rot.y);
      this.rightwing.rotZ(this.rot.z);
      this.bbase.trans(this.pos);
      this.leftwing.trans(this.pos);
      this.rightwing.trans(this.pos);
    },
    draw: function() {
      this.bbase.draw();
      this.leftwing.draw();
      this.rightwing.draw();
    },
    tri: function(i) {
      var v1, v2, v3, v;
      v = Bird.v[Bird.beak[i][0]];
      v1 = new Bird.Vtr(v[0], v[1], v[2]);
      v = Bird.v[Bird.beak[i][1]];
      v2 = new Bird.Vtr(v[0], v[1], v[2]);
      v = Bird.v[Bird.beak[i][2]];
      v3 = new Bird.Vtr(v[0], v[1], v[2]);
      return new Bird.Tri(v1, v2, v3);
    },
    wang: function(y) {
      var v1 = Bird.v[Bird.beak[1][1]];
      this.rot.x = Math.atan2(y, v1[0]);
    },
    zpos: function() {
      var z1 = this.bbase._z();
      var z2 = this.leftwing._z();
      var z3 = this.rightwing._z();
      return Math.min(z1, z2, z3);
    },
    wing: function(y) {
      this.wY = y;
    }
  }
);
Bird.Tri = Bird.def(
  function(p1, p2, p3) {
    this.mainv = [p1.copy(), p2.copy(), p3.copy()];
    this.Vtxs = [p1.copy(), p2.copy(), p3.copy()];
    this.bv = new Bird.Vtr(0.243, 0.247, 0.243);
  }, {
    draw: function() {
      var v1 = [this.Vtxs[0].Pt().x, this.Vtxs[0].Pt().y];
      var v2 = [this.Vtxs[1].Pt().x, this.Vtxs[1].Pt().y];
      var v3 = [this.Vtxs[2].Pt().x, this.Vtxs[2].Pt().y];
      var col = this.col();
      Bird.$.fillStyle = col;
      Bird.$.strokeStyle = col;
      Bird.$.lineWidth = 0.1;
      Bird.$.beginPath();
      Bird.$.moveTo(v1[0], v1[1]);
      Bird.$.lineTo(v2[0], v2[1]);
      Bird.$.lineTo(v3[0], v3[1]);
      Bird.$.lineTo(v1[0], v1[1]);
      Bird.$.closePath();
      Bird.$.fill();
      Bird.$.stroke();
    },
    rotX: function(a) {
      var ang = a;
      this.Vtxs.forEach(
        function(e, i, a) {
          Bird.Matrix.rotX(e, ang);
        }
      );
    },
    rotY: function(a) {
      var ang = a;
      this.Vtxs.forEach(
        function(e, i, a) {
          Bird.Matrix.rotY(e, ang);
        }
      );
    },
    rotZ: function(a) {
      var ang = a;
      this.Vtxs.forEach(
        function(e, i, a) {
          Bird.Matrix.rotZ(e, ang);
        }
      );
    },
    trans: function(s) {
      var trans = s;
      this.Vtxs.forEach(
        function(e, i, a) {
          Bird.Matrix.trans(e, [trans.x, trans.y, trans.z]);
        }
      );
    },
    vtx: function(idx) {
      for (var i = 0; i < 3; i++) {
        var x = this.mainv[i].x;
        var y = this.mainv[i].y;
        var z = this.mainv[i].z;
        this.Vtxs[i].x = x;
        this.Vtxs[i].y = y;
        this.Vtxs[i].z = z;
      }
    },
    wingY: function(y) {
      this.Vtxs[0].y = y;
    },
    _z: function() {
      return Math.min(this.Vtxs[0].z, this.Vtxs[1].z, this.Vtxs[2].z);
    },
    col: function() {
      var e = 0.3,
          f = 0.3,
          g = 0.7;
      var bw = new Bird.Vtr(1, 1, 1);
      var n = this.norm();
      var x = this.Vtxs[0].copy();
      var v = x.sub(Bird.V);
      v.level();
      x = this.Vtxs[0].copy();
      var l = x.sub(Bird.L);
      l.level();
      var p = l.p(n);
      var x1 = n.copy();
      x1.scale(p);
      x1.scale(2);
      var r = l.copy();
      r.sub(x1);
      x1.scale(-1);
      p = Math.max(x1.p(l), 0);
      var col = this.bv.copy();
      col.scale(p);
      col.scale(col, e);
      x1 = col.copy();
      var x2 = r.copy();
      x2.scale(-1);
      p = Math.pow(Math.max(x2.p(v)), 20);
      x2 = bw.copy();
      x2.scale(p * f);
      var x3 = this.bv.copy();
      x3.scale(g);
      x1.add(x2);
      x1.add(x3);
      var _r = Math.floor(x1.x * 255);
      var _g = Math.floor(x1.y * 255);
      var _b = Math.floor(x1.z * 255);
      return 'rgb(' + _r + ',' + _g + ',' + _b + ')';
    },
    norm: function() {
      var v1 = this.Vtxs[0];
      var v2 = this.Vtxs[1];
      var v3 = this.Vtxs[2];
      v3.sub(v2);
      v1.sub(v3);
      v3.cross(v1);
      v3.level();
      return v3;
    }
  }
);
Bird.Vtr = Bird.def(
  function(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.fl = 1000;
  }, {
    Pt: function() {
      var zsc = this.fl + this.z;
      var scale = this.fl / zsc;
      var x = this.x * scale;
      var y = this.y * scale;
      return {
        x: x,
        y: y,
        scale: scale
      };
    },
    set: function(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    },
    len: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    add: function(v, w) {

      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    },
    sub: function(v, w) {

      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    },
    subv: function(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    },
    scale: function(upd) {
      this.x *= upd;
      this.y *= upd;
      this.z *= upd;
      return this;
    },
    lowscale: function(upd) {
      if (upd !== 0) {
        var inv = 1 / upd;
        this.x *= inv;
        this.y *= inv;
        this.z *= inv;
      } else {
        this.x = 0;
        this.y = 0;
        this.z = 0;
      }
      return this;
    },
    copy: function(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    },
    dst: function(v) {
      return Math.sqrt(this.dsq(v));
    },
    dsq: function(v) {
      var dx = this.x - v.x;
      var dy = this.y - v.y;
      var dz = this.z - v.z;
      return dx * dx + dy * dy + dz * dz;
    },
    cross: function(v, w) {
      var x = this.x,
        y = this.y,
        z = this.z;
      this.x = y * v.z - z * v.y;
      this.y = z * v.x - x * v.z;
      this.z = x * v.y - y * v.x;
      return this;
    },
    p: function(v) {
      return this.x * v.x + this.y * v.y + this.z * v.z;
    },
    level: function() {
      return this.lowscale(this.len());
    },
    copy: function() {
      return new Bird.Vtr(this.x, this.y, this.z);
    }
  }
);
Bird.Matrix = {
  rotX: function(pt, angX) {
    var pos = [pt.x, pt.y, pt.z];
    var asin = Math.sin(angX);
    var acos = Math.cos(angX);
    var xrot = [];
    xrot[0] = [1, 0, 0];
    xrot[1] = [0, acos, asin];
    xrot[2] = [0, -asin, acos];
    var calc = this.mm(pos, xrot);
    pt.x = calc[0];
    pt.y = calc[1];
    pt.z = calc[2];
  },
  rotY: function(pt, angY) {
    var pos = [pt.x, pt.y, pt.z];
    var asin = Math.sin(angY);
    var acos = Math.cos(angY);
    var yrot = [];
    yrot[0] = [acos, 0, asin];
    yrot[1] = [0, 1, 0];
    yrot[2] = [-asin, 0, acos];
    var calc = this.mm(pos, yrot);
    pt.x = calc[0];
    pt.y = calc[1];
    pt.z = calc[2];
  },
  rotZ: function(pt, angZ) {
    var pos = [pt.x, pt.y, pt.z];
    var asin = Math.sin(angZ);
    var acos = Math.cos(angZ);
    var yrot = [];
    yrot[0] = [acos, asin, 0];
    yrot[1] = [-asin, acos, 0];
    yrot[2] = [0, 0, 1];
    var calc = this.mm(pos, yrot);
    pt.x = calc[0];
    pt.y = calc[1];
    pt.z = calc[2];
  },
  trans: function(pt, s) {
    pt.x += s[0];
    pt.y += s[1];
    pt.z += s[2];
  },
  scale: function(pt, s) {
    pt.x *= s[0];
    pt.y *= s[1];
    pt.z *= s[2];
  },
  mm: function(m1, m2) {
    var calc = [];
    calc[0] = m1[0] * m2[0][0] + m1[1] * m2[1][0] + m1[2] * m2[2][0];
    calc[1] = m1[0] * m2[0][1] + m1[1] * m2[1][1] + m1[2] * m2[2][1];
    calc[2] = m1[0] * m2[0][2] + m1[1] * m2[1][2] + m1[2] * m2[2][2];
    return calc;
  }
}

function initBirds() {
  var c = document.getElementById('canv');
  Bird.$ = c.getContext("2d");
  Bird.canv = {
    w: c.width = window.innerWidth,
    h: c.height = window.innerHeight
  };
  Bird.L = new Bird.Vtr(0, 2000, 5000);
  Bird.V = new Bird.Vtr(0, 0, 5000);

  // Mouse tracking for bird target
  var mouseTarget = new Bird.Vtr(0, 0, 0);
  var mouseInside = false;

  c.addEventListener('mousemove', function(e) {
    var rect = c.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Define smaller follow area (center 60% of canvas)
    var followMargin = 0.2; // 20% margin on each side
    var followLeft = Bird.canv.w * followMargin;
    var followRight = Bird.canv.w * (1 - followMargin);
    var followTop = Bird.canv.h * followMargin;
    var followBottom = Bird.canv.h * (1 - followMargin);

    // Check if mouse is inside the smaller follow area
    if (mx >= followLeft && mx <= followRight && my >= followTop && my <= followBottom) {
      mouseInside = true;
      mouseTarget.x = mx - Bird.canv.w / 2;
      mouseTarget.y = -(my - Bird.canv.h / 2);
      mouseTarget.z = 0;
    } else {
      mouseInside = false;
    }
  });

  c.addEventListener('mouseleave', function() {
    mouseInside = false;
  });

  var birds = [];
  var b = [];
  for (var i = 0; i < 60; i++) {
    _b = b[i] = new Bird.obj();
    // Start birds closer to center for initial reveal
    _b.pos.x = Math.random() * 400 - 200;
    _b.pos.y = Math.random() * 400 - 200;
    _b.pos.z = Math.random() * 400 - 200;
    _b.vel.x = Math.random() * 1.8 - 0.8;
    _b.vel.y = Math.random() * 1.8 - 0.8;
    _b.vel.z = Math.random() * 1.8 - 0.8;
    _b._coll(true);
    _b.param(400, 400, 800);
    _b.mouseTarget = mouseTarget; // Store reference to mouse target
    _b.mouseInside = function() { return mouseInside; }; // Store reference to mouse state
    bird = birds[i] = new Bird.Build();
    bird.phase = Math.floor(Math.random() * 62.83);
    bird.pos = b[i].pos;
  }

  run();

  function run() {
    window.requestAnimationFrame(run);
    draw();
  }

  function draw() {
    // Follow just the first bird for better performance
    var leadBirdX = b[0] ? b[0].pos.x : 0;
    var leadBirdY = b[0] ? b[0].pos.y : 0;

    // Update parallax based on lead bird
    if (window.updateParallaxFromBirds) {
      window.updateParallaxFromBirds(leadBirdX, leadBirdY);
    }

    // Update leaf parallax to match lead bird
    if (window.leafParallax) {
      window.leafParallax.x = leadBirdX;
      window.leafParallax.y = leadBirdY;
    }

    Bird.$.setTransform(1, 0, 0, 1, 0, 0);
    Bird.$.translate(Bird.canv.w / 2, Bird.canv.h / 2);
    Bird.$.clearRect(-Bird.canv.w / 2, -Bird.canv.h / 2, Bird.canv.w, Bird.canv.h);
    Bird.$.scale(1, -1);
    var arr = [];
    b.forEach(function(e, i, a) {
      var _b = b[i];
      _b.run(b);
      var bird = birds[i];
      bird.rot.y = Math.atan2(-_b.vel.z, _b.vel.x);
      bird.rot.z = Math.asin(_b.vel.y / _b.vel.len());
      bird.phase = (bird.phase + (Math.max(0, bird.rot.z) + 0.1)) % 62.83;
      bird.wing(Math.sin(bird.phase) * 5);
      bird.matrix();
      arr.push({
        z: bird.zpos(),
        o: bird
      });
    });
    arr.sort(function(a, b) {
      return a.z < b.z ? -1 : a.z > b.z ? 1 : 0;
    });
    arr.forEach(function(e, i, a) {
      e.o.draw();
    });
  }
}

// Store function globally to be called after water animation
window.startBirdAnimation = initBirds;
window.addEventListener('resize',function(){
   if(c.width!==window.innerWidth && c.height!==window.innerHeight){
     Bird.canv = {
      w: c.width = window.innerWidth,
      h: c.height = window.innerHeight
    };
   }
});

// Falling Leaves Animation
var LeafScene = function(el) {
  this.viewport = el;
  this.world = document.createElement('div');
  this.leaves = [];

  this.options = {
    numLeaves: 5,
    wind: {
      magnitude: 1.2,
      maxSpeed: 12,
      duration: 300,
      start: 0,
      speed: 0
    },
  };

  this.width = this.viewport.offsetWidth;
  this.height = this.viewport.offsetHeight;

  // animation helper
  this.timer = 0;

  this._resetLeaf = function(leaf) {
    // place leaf on the RIGHT side only
    leaf.x = this.width + 10 - Math.random() * 100; // Start from right edge with slight variation
    leaf.y = -10 - Math.random() * 100; // Start above screen
    leaf.z = Math.random()*200;

    // at the start, the leaf can be anywhere on right side
    if (this.timer == 0) {
      leaf.x = this.width + 10 - Math.random() * 150;
      leaf.y = Math.random()*this.height;
    }

    // Choose axis of rotation.
    // If axis is not X, chose a random static x-rotation for greater variability
    leaf.rotation.speed = Math.random()*10;
    var randomAxis = Math.random();
    if (randomAxis > 0.5) {
      leaf.rotation.axis = 'X';
    } else if (randomAxis > 0.25) {
      leaf.rotation.axis = 'Y';
      leaf.rotation.x = Math.random()*180 + 90;
    } else {
      leaf.rotation.axis = 'Z';
      leaf.rotation.x = Math.random()*360 - 180;
      // looks weird if the rotation is too fast around this axis
      leaf.rotation.speed = Math.random()*3;
    }

    // random speed
    leaf.xSpeedVariation = Math.random() * 0.8 - 0.4;
    leaf.ySpeed = Math.random() * 2 + 3; // Faster falling: 3-5 pixels per frame

    return leaf;
  }

  this._updateLeaf = function(leaf) {
    var leafWindSpeed = this.options.wind.speed(this.timer - this.options.wind.start, leaf.y);

    // Move left and down (from right side)
    var xSpeed = leafWindSpeed + leaf.xSpeedVariation;
    leaf.x -= Math.abs(xSpeed); // Always move left
    leaf.y += leaf.ySpeed;
    leaf.rotation.value += leaf.rotation.speed;

    // Apply parallax effect based on mouse position
    var parallaxX = 0;
    var parallaxY = 0;
    if (window.leafParallax) {
      parallaxX = window.leafParallax.x * 0.02; // Subtle effect
      parallaxY = window.leafParallax.y * 0.02;
    }

    var t = 'translateX( ' + (leaf.x + parallaxX) + 'px ) translateY( ' + (leaf.y + parallaxY) + 'px ) translateZ( ' + leaf.z + 'px )  rotate' + leaf.rotation.axis + '( ' + leaf.rotation.value + 'deg )';
    if (leaf.rotation.axis !== 'X') {
      t += ' rotateX(' + leaf.rotation.x + 'deg)';
    }
    leaf.el.style.webkitTransform = t;
    leaf.el.style.MozTransform = t;
    leaf.el.style.oTransform = t;
    leaf.el.style.transform = t;

    // reset if out of view (left or bottom)
    if (leaf.x < -10 || leaf.y > this.height + 10) {
      this._resetLeaf(leaf);
    }
  }

  this._updateWind = function() {
    // wind follows a sine curve: asin(b*time + c) + a
    // where a = wind magnitude as a function of leaf position, b = wind.duration, c = offset
    // wind duration should be related to wind magnitude, e.g. higher windspeed means longer gust duration

    if (this.timer === 0 || this.timer > (this.options.wind.start + this.options.wind.duration)) {

      this.options.wind.magnitude = Math.random() * this.options.wind.maxSpeed;
      this.options.wind.duration = this.options.wind.magnitude * 50 + (Math.random() * 20 - 10);
      this.options.wind.start = this.timer;

      var screenHeight = this.height;

      this.options.wind.speed = function(t, y) {
        // should go from full wind speed at the top, to 1/2 speed at the bottom, using leaf Y
        var a = this.magnitude/2 * (screenHeight - 2*y/3)/screenHeight;
        return a * Math.sin(2*Math.PI/this.duration * t + (3 * Math.PI/2)) + a;
      }
    }
  }
}

LeafScene.prototype.init = function() {
  for (var i = 0; i < this.options.numLeaves; i++) {
    var leaf = {
      el: document.createElement('div'),
      x: 0,
      y: 0,
      z: 0,
      rotation: {
        axis: 'X',
        value: 0,
        speed: 0,
        x: 0
      },
      xSpeedVariation: 0,
      ySpeed: 0,
      path: {
        type: 1,
        start: 0,
      },
      image: 1
    };
    this._resetLeaf(leaf);
    this.leaves.push(leaf);
    this.world.appendChild(leaf.el);
  }

  this.world.className = 'leaf-scene';
  this.viewport.appendChild(this.world);

  // set perspective
  this.world.style.webkitPerspective = "400px";
  this.world.style.MozPerspective = "400px";
  this.world.style.oPerspective = "400px";
  this.world.style.perspective = "400px";

  // reset window height/width on resize
  var self = this;
  window.onresize = function(event) {
    self.width = self.viewport.offsetWidth;
    self.height = self.viewport.offsetHeight;
  };
}

LeafScene.prototype.render = function() {
  this._updateWind();
  for (var i = 0; i < this.leaves.length; i++) {
    this._updateLeaf(this.leaves[i]);
  }

  this.timer++;

  requestAnimationFrame(this.render.bind(this));
}

// Global parallax tracking for leaves (updated by bird flock)
window.leafParallax = { x: 0, y: 0 };

// start up leaf scene - will be triggered after GSAP animation
window.startLeafAnimation = function() {
  var leafContainer = document.querySelector('.falling-leaves');
  if (leafContainer && !window.leafSceneStarted) {
    window.leafSceneStarted = true;
    var leaves = new LeafScene(leafContainer);
    leaves.init();
    leaves.render();
  }
};