import { icon } from "./icons.js";
import { esc } from "../utils/format.js";
import { countUp } from "../utils/motion.js";

export const trendMarkup = (t, note = "vs. prior period") => `
  <p class="trend trend--${t.dir}">${icon(t.dir === "up" ? "arrow-up-right" : "arrow-down-right", { size: 14 })}<strong><span class="sr-only">${t.dir === "up" ? "Up" : "Down"} </span>${t.pct}%</strong>${note ? `<span class="trend__note">${esc(note)}</span>` : ""}</p>`;

export const statCard = (s, i = 0, animate = true) => `
  <li class="card stat${animate ? " reveal" : ""}"${animate ? ` style="--i:${i + 1}"` : ""}>
    <div class="stat__top"><p class="stat__label">${esc(s.label)}</p><span class="icon-chip" aria-hidden="true">${icon(s.icon, { size: 16 })}</span></div>
    <p class="stat__value" data-count="${i}">${esc(s.prefix ?? "")}${s.value}${esc(s.suffix ?? "")}</p>
    ${trendMarkup(s.trend)}
  </li>`;

export function animateStats(root, stats) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const s = stats[Number(el.dataset.count)];
    countUp(el, {
      to: s.value,
      decimals: s.decimals,
      prefix: s.prefix ?? "",
      suffix: s.suffix ?? "",
    });
  });
}
