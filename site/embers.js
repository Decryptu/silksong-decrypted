// Title-screen backdrop: sparse embers drifting up through a dark field, like the game's main menu.
(() => {
  const canvas = document.createElement("canvas");
  canvas.className = "embers";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let w = 0, h = 0, dpr = 1, embers = [], last = 0;

  const spawn = (anywhere) => {
    const depth = Math.random();                 // 0 = far, 1 = near
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 20,
      len: 2 + depth * 9,                         // streak length (motion blur)
      size: .6 + depth * 1.6,
      vy: 18 + depth * 55,                        // px per second, upward
      vx: (Math.random() - .3) * 14,              // slight drift to the right
      sway: Math.random() * Math.PI * 2,
      life: 0,
      alpha: .5 + depth * .5,
      hue: 14 + Math.random() * 20,
    };
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (w * h) / 11000));
    embers = Array.from({ length: count }, () => spawn(true));
    if (still.matches) draw(0);
  };

  const draw = (dt) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const e of embers) {
      e.life += dt;
      e.y -= e.vy * dt;
      e.x += (e.vx + Math.sin(e.life * 1.3 + e.sway) * 6) * dt;
      if (e.y < -20 || e.x < -20 || e.x > w + 20) Object.assign(e, spawn(false));
      // Fade toward the top of the screen; embers burn out as they rise.
      const fade = Math.max(0, Math.min(1, e.y / h * 1.4)) * e.alpha * Math.min(1, e.life * 2);
      const flicker = .75 + Math.sin(e.life * 9 + e.sway) * .25;
      const dx = e.vx / e.vy * e.len, dy = e.len;
      ctx.strokeStyle = `hsla(${e.hue}, 100%, 58%, ${fade * flicker})`;
      ctx.lineWidth = e.size;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x - dx, e.y + dy); ctx.stroke();
    }
  };

  const frame = (t) => {
    const dt = Math.min(.05, (t - last) / 1000 || 0);
    last = t;
    if (!document.hidden) draw(dt);
    if (!still.matches) requestAnimationFrame(frame);
  };

  addEventListener("resize", resize);
  still.addEventListener?.("change", () => { if (!still.matches) requestAnimationFrame(frame); });
  resize();
  if (!still.matches) requestAnimationFrame(frame);
})();
