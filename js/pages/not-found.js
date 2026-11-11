import { icon } from "../ui/icons.js";

export function render(outlet) {
  outlet.innerHTML = `
    <div class="card state-panel reveal">
      <span class="icon-chip">${icon("search", { size: 20 })}</span>
      <h1 class="state-panel__title">Page not found</h1>
      <p class="state-panel__text">The page you’re looking for doesn’t exist or has moved.</p>
      <a class="btn btn--primary" href="#/overview">Go to Overview</a>
    </div>`;
}
