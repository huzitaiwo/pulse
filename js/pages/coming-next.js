import { icon } from "../ui/icons.js";
import { esc } from "../utils/format.js";

/** Placeholder for pages that haven't been built yet. */
export function render(outlet, { nav }) {
  outlet.innerHTML = `
    <div class="card state-panel reveal">
      <span class="icon-chip">${icon(nav.icon, { size: 20 })}</span>
      <h1 class="state-panel__title">${esc(nav.label)}</h1>
      <p class="state-panel__text">This page is coming next.</p>
      <a class="btn btn--secondary" href="#/overview">Back to Overview</a>
    </div>`;
}
