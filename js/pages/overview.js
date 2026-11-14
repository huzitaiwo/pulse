import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { renderAreaChart } from "../charts/area-chart.js";
import { renderDonut } from "../charts/donut-chart.js";
import { statCard, trendMarkup, animateStats } from "../ui/stat-card.js";
import {
  esc,
  initials,
  formatCurrency,
  formatRelative,
  greeting,
} from "../utils/format.js";

const AVATAR_TONE = { teal: " avatar--teal", amber: " avatar--amber", "": "" };

function header(session) {
  return `
    <header class="page-head reveal">
      <div>
        <p class="eyebrow">Workspace</p>
        <h1 class="page-title">${greeting()}, ${esc(session.user.name)}</h1>
        <p class="page-sub">Here’s the operating picture for your workspace today.</p>
      </div>
      <button class="btn btn--primary" type="button" data-palette-open data-palette-query="Create">${icon("plus", { size: 16 })}Create overview</button>
    </header>`;
}

function skeleton(session) {
  const card = (h) =>
    `<div class="card"><div class="skeleton" style="height:${h}"></div></div>`;
  return `${header(session)}
    <div aria-busy="true" aria-label="Loading overview">
      <div class="stats__grid">${[0, 1, 2, 3].map(() => card("5.5rem")).join("")}</div>
      <div class="layout-row layout-row--split">${card("17rem")}${card("17rem")}</div>
      <div class="layout-row layout-row--even">${card("10rem")}${card("10rem")}</div>
    </div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your overview</h2>
    <p class="state-panel__text">Something went wrong while fetching workspace data. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

function content(session, data) {
  const { revenue, health } = data;
  const first = revenue.points[0].label,
    last = revenue.points.at(-1).label;

  return `${header(session)}
    <section aria-labelledby="stats-title" class="stats">
      <h2 class="sr-only" id="stats-title">Key metrics</h2>
      <ul class="stats__grid" role="list">${data.stats.map((s, i) => statCard(s, i)).join("")}</ul>
    </section>

    <div class="layout-row layout-row--split">
      <section class="card reveal" style="--i:5" aria-labelledby="revenue-title">
        <header class="card__head">
          <div><p class="eyebrow">Revenue</p><h2 class="card__title" id="revenue-title">Revenue performance</h2></div>
          <a class="link-action" href="#/analytics">View analytics ${icon("chevron", { size: 14 })}</a>
        </header>
        <div class="figure">
          <p class="figure__value">${formatCurrency(revenue.total)}</p>
          ${trendMarkup({ dir: "up", pct: revenue.delta }, "from last period")}
        </div>
        <div class="chart" data-chart="revenue" tabindex="0" role="group" aria-label="Revenue from ${first} to ${last}. Use left and right arrow keys to read each month."></div>
        <ol class="chart-axis" aria-hidden="true">${revenue.points.map((p) => `<li>${esc(p.label)}</li>`).join("")}</ol>
      </section>

      <section class="card health reveal" style="--i:6" aria-labelledby="health-title">
        <header class="card__head">
          <div><p class="eyebrow">Portfolio</p><h2 class="card__title" id="health-title">Project health</h2></div>
          <button class="icon-btn" type="button" aria-label="Project health options">${icon("more")}</button>
        </header>
        <div class="health__body">
          <div class="donut" data-donut role="img" aria-label="${health.score}% of projects ${esc(health.label)}"></div>
          <dl class="legend">
            ${health.legend.map((l) => `<div class="legend__row"><dt><span class="dot dot--${l.tone}" aria-hidden="true"></span>${esc(l.label)}</dt><dd>${l.count}</dd></div>`).join("")}
          </dl>
        </div>
        <a class="btn btn--secondary btn--block" href="#/projects">Review projects ${icon("arrow-up-right", { size: 14 })}</a>
      </section>
    </div>

    <div class="layout-row layout-row--even">
      <section class="card reveal" style="--i:7" aria-labelledby="focus-title">
        <header class="card__head">
          <div><p class="eyebrow">Your focus</p><h2 class="card__title" id="focus-title">Priority actions</h2></div>
          <a class="link-action" href="#/tasks">All tasks ${icon("chevron", { size: 14 })}</a>
        </header>
        <ul class="focus-list" role="list">
          ${data.focus
            .map(
              (t) => `
            <li class="focus-item focus-item--${t.tone}">
              <span class="focus-item__bar" aria-hidden="true"></span>
              <div class="focus-item__body">
                <p class="focus-item__title">${esc(t.title)}</p>
                <p class="focus-item__meta"><span class="sr-only">${esc(t.priority)} priority. </span>${esc(t.project)} · Due ${esc(t.due)}</p>
              </div>
              <span class="avatar" title="${esc(t.assignee)}" aria-label="Assigned to ${esc(t.assignee)}">${initials(t.assignee)}</span>
            </li>`,
            )
            .join("")}
        </ul>
      </section>

      <section class="card reveal" style="--i:8" aria-labelledby="activity-title">
        <header class="card__head">
          <div><p class="eyebrow">Momentum</p><h2 class="card__title" id="activity-title">Recent activity</h2></div>
          <a class="link-action" href="#/activity">View all ${icon("chevron", { size: 14 })}</a>
        </header>
        <ol class="timeline" role="list">
          ${data.activity
            .map(
              (a) => `
            <li class="timeline__item">
              <span class="avatar${AVATAR_TONE[a.tone] ?? ""}" aria-hidden="true">${initials(a.actor)}</span>
              <div>
                <p class="timeline__text"><strong>${esc(a.actor)}</strong> ${esc(a.verb)} <a href="${esc(a.href)}">${esc(a.target)}</a></p>
                <time class="timeline__time" datetime="${new Date(Date.now() - a.minutesAgo * 60000).toISOString()}">${formatRelative(a.minutesAgo)}</time>
              </div>
            </li>`,
            )
            .join("")}
        </ol>
      </section>
    </div>`;
}

export function render(outlet, { session }) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton(session);
    try {
      const data = await repository.getOverview();
      if (!alive) return;
      outlet.innerHTML = content(session, data);

      animateStats(outlet, data.stats);
      renderAreaChart(outlet.querySelector("[data-chart=revenue]"), {
        points: data.revenue.points,
        format: formatCurrency,
        seriesLabel: "Revenue",
      });
      renderDonut(outlet.querySelector("[data-donut]"), {
        segments: data.health.ring,
        value: `${data.health.score}%`,
        label: data.health.label,
      });
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header(session) + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  load();
  return () => {
    alive = false;
  };
}
