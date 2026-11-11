const W = 600;
const H = 200;
const PAD_TOP = 8;
let uid = 0;

/** Monotone cubic path through points, so the curve never dips below its data. */
function smoothPath(pts) {
  const n = pts.length;
  const slope = (i) => (pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x);
  const t = pts.map((_, i) => {
    if (i === 0) return slope(0);
    if (i === n - 1) return slope(n - 2);
    const a = slope(i - 1),
      b = slope(i);
    return a * b <= 0 ? 0 : (a + b) / 2;
  });
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (pts[i + 1].x - pts[i].x) / 3;
    d += ` C${pts[i].x + dx},${pts[i].y + t[i] * dx} ${pts[i + 1].x - dx},${pts[i + 1].y - t[i + 1] * dx} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

export function renderAreaChart(
  container,
  { points, format = String, seriesLabel = "Value" },
) {
  const id = `area-${++uid}`;
  const max = Math.max(...points.map((p) => p.value));
  const xAt = (i) => (i / (points.length - 1)) * W;
  const yAt = (v) => H - (v / max) * (H - PAD_TOP);
  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.value) }));
  const line = smoothPath(coords);

  container.innerHTML = `
    <svg class="chart__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style="stop-color:var(--color-brand);stop-opacity:.34"/>
          <stop offset="1" style="stop-color:var(--color-brand);stop-opacity:0"/>
        </linearGradient>
      </defs>
      ${[0.25, 0.5, 0.75].map((r) => `<line class="chart__grid" x1="0" x2="${W}" y1="${H * r}" y2="${H * r}"/>`).join("")}
      <path d="${line} L${W},${H} L0,${H} Z" fill="url(#${id})"/>
      <path class="chart__line" d="${line}"/>
    </svg>
    <div class="chart__guide" hidden></div>
    <div class="chart__dot" hidden></div>
    <div class="chart__tip" hidden aria-hidden="true"></div>
    <table class="sr-only"><caption>${seriesLabel} by month</caption>
      <thead><tr><th scope="col">Month</th><th scope="col">${seriesLabel}</th></tr></thead>
      <tbody>${points.map((p) => `<tr><th scope="row">${p.label}</th><td>${format(p.value)}</td></tr>`).join("")}</tbody>
    </table>`;

  const guide = container.querySelector(".chart__guide");
  const dot = container.querySelector(".chart__dot");
  const tip = container.querySelector(".chart__tip");
  let current = -1;

  const show = (i) => {
    i = Math.max(0, Math.min(points.length - 1, i));
    if (i === current) return;
    current = i;
    const left = (i / (points.length - 1)) * 100;
    const top = (coords[i].y / H) * 100;
    guide.style.left = `${left}%`;
    dot.style.left = `${left}%`;
    dot.style.top = `${top}%`;
    tip.innerHTML = `<strong>${format(points[i].value)}</strong><span>${points[i].label}</span>`;
    tip.style.left = `${left}%`;
    tip.style.transform =
      i === 0
        ? "none"
        : i === points.length - 1
          ? "translateX(-100%)"
          : "translateX(-50%)";
    [guide, dot, tip].forEach((el) => (el.hidden = false));
  };
  const hide = () => {
    current = -1;
    [guide, dot, tip].forEach((el) => (el.hidden = true));
  };

  container.addEventListener("pointermove", (e) => {
    const r = container.getBoundingClientRect();
    show(Math.round(((e.clientX - r.left) / r.width) * (points.length - 1)));
  });
  container.addEventListener("pointerleave", hide);
  container.addEventListener("focus", () => show(points.length - 1));
  container.addEventListener("blur", hide);
  container.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      show(current + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      show(current < 0 ? points.length - 1 : current - 1);
    }
    if (e.key === "Escape") hide();
  });
}
