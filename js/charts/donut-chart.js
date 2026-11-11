import { prefersReducedMotion } from "../utils/motion.js";

const RADIUS = 42;
const GAP = 1.4;

/** segments: [{ tone, pct }] where pct values add up to 100. */
export function renderDonut(container, { segments, value, label }) {
  let start = 0;
  const arcs = segments
    .map((seg, i) => {
      const len = Math.max(seg.pct - GAP, 0);
      const markup = `<circle class="donut__seg" data-tone="${seg.tone}" cx="50" cy="50" r="${RADIUS}" pathLength="100" style="--len:${len};--off:${-start};--delay:${i * 0.12}s"/>`;
      start += seg.pct;
      return markup;
    })
    .join("");

  container.innerHTML = `
    <svg class="donut__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle class="donut__track" cx="50" cy="50" r="${RADIUS}"/>${arcs}
    </svg>
    <div class="donut__center"><strong>${value}</strong><span>${label}</span></div>`;

  if (prefersReducedMotion()) container.classList.add("is-ready");
  else
    requestAnimationFrame(() =>
      requestAnimationFrame(() => container.classList.add("is-ready")),
    );
}
