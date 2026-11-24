// Interactive hero visual: a point-cloud particle sphere and a particle wave field,
// both reacting to cursor position within the hero section (sphere ripples outward
// from the cursor, wave lifts/glows near it).
(function () {
  const heroEl = document.getElementById("hero");
  const canvas = document.getElementById("hero-canvas");
  if (!heroEl || !canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, dpr = 1;
  function resize() {
    const rect = heroEl.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sphereCenter.x = w * 0.72;
    sphereCenter.y = h * 0.4;
  }

  // ----- Particle sphere (Fibonacci sphere distribution) -----
  const SPHERE_N = 280;
  const sphereR = 270;
  const spherePts = [];
  for (let i = 0; i < SPHERE_N; i++) {
    const y = 1 - (i / (SPHERE_N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    spherePts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  const sphereCenter = { x: 0, y: 0 };

  // ----- Particle wave grid -----
  const WAVE_COLS = 30;
  const WAVE_ROWS = 7;

  let mouseX = -9999, mouseY = -9999;
  let targetRotY = 0, targetRotX = 0;
  let curRotY = 0, curRotX = 0;

  // ----- Banner-wide cursor ripples -----
  const RIPPLE_LIFE = 950; // ms
  const RIPPLE_MAX_R = 130;
  let ripples = [];
  let lastRippleAt = 0;

  if (!reduceMotion) {
    heroEl.addEventListener("mousemove", (e) => {
      const rect = heroEl.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      targetRotY = (mouseX / w - 0.5) * 1.1;
      targetRotX = (mouseY / h - 0.5) * -0.8;

      const now = performance.now();
      if (now - lastRippleAt > 220) {
        lastRippleAt = now;
        ripples.push({ x: mouseX, y: mouseY, start: now });
        if (ripples.length > 10) ripples.shift();
      }
    });
    heroEl.addEventListener("mouseleave", () => {
      mouseX = -9999;
      mouseY = -9999;
      targetRotY = 0;
      targetRotX = 0;
    });
  }

  function drawRipples() {
    if (ripples.length === 0) return;
    const now = performance.now();
    ripples = ripples.filter((r) => now - r.start < RIPPLE_LIFE);
    ripples.forEach((r) => {
      const age = (now - r.start) / RIPPLE_LIFE;
      const radius = age * RIPPLE_MAX_R;
      const alpha = (1 - age) * 0.2;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(170, 225, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  resize();
  window.addEventListener("resize", resize);

  let t = 0;
  let autoAngle = 0;

  function drawSphere() {
    const rotY = autoAngle + curRotY;
    const rotX = 0.22 + curRotX;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    const projected = spherePts.map((p) => {
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      return { x: x1, y: y2, z: z2 };
    });
    projected.sort((a, b) => a.z - b.z);

    const glow = ctx.createRadialGradient(
      sphereCenter.x, sphereCenter.y, 0,
      sphereCenter.x, sphereCenter.y, sphereR * 1.3
    );
    glow.addColorStop(0, "rgba(160,220,255,.32)");
    glow.addColorStop(0.6, "rgba(160,220,255,.1)");
    glow.addColorStop(1, "rgba(160,220,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sphereCenter.x, sphereCenter.y, sphereR * 1.3, 0, Math.PI * 2);
    ctx.fill();

    const hovering = mouseX > -1000;
    projected.forEach((p) => {
      const scale = 320 / (320 + p.z * sphereR * 0.9 + 320);
      let sx = sphereCenter.x + p.x * sphereR * scale;
      let sy = sphereCenter.y + p.y * sphereR * scale;
      const depth = (p.z + 1) / 2;
      let radius = Math.max(1, 2.6 * scale);
      let alpha = 0.32 + depth * 0.68;

      // cursor-driven ripple: waves travel outward across the sphere from the pointer
      if (hovering) {
        const dx = sx - mouseX, dy = sy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / (sphereR * 1.5));
        if (influence > 0) {
          const ripple = Math.sin(dist * 0.07 - t * 7) * influence * 18;
          const nx = dist > 0.001 ? dx / dist : 0;
          const ny = dist > 0.001 ? dy / dist : 0;
          sx += nx * ripple;
          sy += ny * ripple;
          radius += influence * 1.6;
          alpha = Math.min(1, alpha + influence * 0.35);
        }
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(210, 238, 255, ${alpha})`;
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawWave() {
    const waveTop = h * 0.6;
    const waveBottom = h * 1.08;
    const waveLeft = -w * 0.08;
    const waveWidth = w * 1.16;

    for (let r = 0; r < WAVE_ROWS; r++) {
      const rowT = r / (WAVE_ROWS - 1);
      const rowY = waveTop + rowT * rowT * (waveBottom - waveTop);
      const rowAlphaBase = 0.06 + rowT * 0.48;
      const size = 0.8 + rowT * 1.6;

      for (let c = 0; c < WAVE_COLS; c++) {
        const colT = c / (WAVE_COLS - 1);
        const px = waveLeft + colT * waveWidth;
        const wobble = Math.sin(colT * 10 + t * 1.5 + r * 0.4) * (6 + rowT * 10);
        let py = rowY + wobble;

        let extraAlpha = 0;
        if (mouseX > -1000) {
          const dx = px - mouseX, dy = py - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 150;
          if (dist < radius) {
            const f = 1 - dist / radius;
            py -= f * 24;
            extraAlpha = f * 0.55;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(150, 215, 255, ${Math.min(1, rowAlphaBase + extraAlpha)})`;
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  let rafId = null;
  let isVisible = true;

  function frame() {
    t += 0.008;
    autoAngle += 0.0022;
    curRotY += (targetRotY - curRotY) * 0.05;
    curRotX += (targetRotX - curRotX) * 0.05;

    ctx.clearRect(0, 0, w, h);
    drawRipples();
    drawSphere();
    drawWave();

    if (!reduceMotion && isVisible) rafId = requestAnimationFrame(frame);
    else rafId = null;
  }

  // Stop all per-frame canvas work once the hero scrolls out of view —
  // this is the main fix for scroll jank elsewhere on the page.
  if ("IntersectionObserver" in window) {
    const visObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && rafId === null && !reduceMotion) {
          rafId = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    visObserver.observe(heroEl);
  }

  if (reduceMotion) {
    frame();
  } else {
    rafId = requestAnimationFrame(frame);
  }
})();
