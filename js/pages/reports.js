import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { esc, formatUpdated } from "../utils/format.js";

function header() {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Insights</p>
        <h1 class="page-title">Reports</h1>
        <p class="page-sub">Curated operating reports for the conversations that shape your next move.</p>
      </div>
      <button class="btn btn--primary" type="button" data-build>${icon("plus", { size: 16 })}Build report</button>
    </header>`;
}

function skeleton() {
  return `${header()}
    <div class="report-grid" aria-busy="true" aria-label="Loading reports">
      ${[0, 1, 2, 3].map(() => '<div class="card"><div class="skeleton" style="height:12rem"></div></div>').join("")}
    </div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your reports</h2>
    <p class="state-panel__text">Something went wrong while fetching saved reports. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

function emptyState() {
  return `<div class="card state-panel">
    <span class="icon-chip">${icon("reports", { size: 20 })}</span>
    <h2 class="state-panel__title">No reports yet</h2>
    <p class="state-panel__text">Saved reports will appear here. Build your first one to share a clear picture with your team.</p>
    <button class="btn btn--primary" type="button" data-build>${icon("plus", { size: 16 })}Build report</button>
  </div>`;
}

function cardMarkup(r, i) {
  return `
    <li>
      <article class="card report-card reveal" style="--i:${i + 1}">
        <span class="icon-chip${r.tone ? ` icon-chip--${r.tone}` : ""}" aria-hidden="true">${icon(r.icon, { size: 20 })}</span>
        <div class="report-card__body">
          <p class="eyebrow">Saved report</p>
          <h2 class="report-card__title">${esc(r.title)}</h2>
          <p class="report-card__desc">${esc(r.description)}</p>
        </div>
        <footer class="report-card__foot">
          <span>${formatUpdated(r.updatedAt)}</span>
          <a class="link-action" href="${esc(r.href)}">Open report<span class="sr-only">: ${esc(r.title)}</span> ${icon("arrow-up-right", { size: 14 })}</a>
        </footer>
      </article>
    </li>`;
}

export function render(outlet) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton();
    try {
      const reports = await repository.getReports();
      if (!alive) return;
      outlet.innerHTML = `${header()}${
        reports.length
          ? `<ul class="report-grid" role="list">${reports.map(cardMarkup).join("")}</ul>`
          : emptyState()
      }`;
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header() + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  outlet.addEventListener("click", (event) => {
    if (event.target.closest("[data-build]"))
      toast("The report builder is coming next.", { type: "info" });
  });

  load();
  return () => {
    alive = false;
  };
}
