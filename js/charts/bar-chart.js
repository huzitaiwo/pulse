import { esc } from "../utils/format.js";

/** bars: [{ label: "M", name: "Monday", value: 64, highlight?: true }], value is the % height. */
export function renderBarChart(
  container,
  { bars, label, format = (v) => `${v}%` },
) {
  container.innerHTML = `
    <ol class="bars" role="list" style="--n:${bars.length}" aria-label="${esc(label)}">
      ${bars
        .map(
          (b, i) => `
        <li class="bars__item" tabindex="0" style="--h:${b.value}%;--i:${i}" data-tip="${esc(b.name)} · ${format(b.value)}">
          <span class="bars__bar${b.highlight ? " bars__bar--accent" : ""}"></span>
          <span class="sr-only">${esc(b.name)}: ${format(b.value)}</span>
        </li>`,
        )
        .join("")}
    </ol>
    <ol class="bars__labels" role="list" aria-hidden="true" style="--n:${bars.length}">
      ${bars.map((b) => `<li>${esc(b.label)}</li>`).join("")}
    </ol>`;
}
