import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { statCard, trendMarkup, animateStats } from "../ui/stat-card.js";
import { mountSelectMenu } from "../ui/select-menu.js";
import { renderAreaChart } from "../charts/area-chart.js";
import { renderBarChart } from "../charts/bar-chart.js";
import { esc, initials, formatCurrency } from "../utils/format.js";

const SUBTITLE =
  "Make the next decision with a calm, shared view of your operating data.";

function header({ withRange = true, animate = true } = {}) {
  return `
    <header class="page-head${animate ? " reveal" : ""}">
      <div>
        <p class="eyebrow">Intelligence</p>
        <h1 class="page-title">Analytics</h1>
        <p class="page-sub">${SUBTITLE}</p>
      </div>
      ${withRange ? '<div data-select="range"></div>' : ""}
    </header>`;
}

function skeleton() {
  const card = (h) =>
    `<div class="card"><div class="skeleton" style="height:${h}"></div></div>`;
  return `${header({ withRange: false })}
    <div aria-busy="true" aria-label="Loading analytics">
      <div class="stats__grid stats__grid--3">${[0, 1, 2].map(() => card("5.5rem")).join("")}</div>
      <div class="layout-row layout-row--split">${card("20rem")}${card("20rem")}</div>
      <div class="layout-row">${card("16rem")}</div>
    </div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load analytics</h2>
    <p class="state-panel__text">Something went wrong while fetching your data. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

function content(data, animate) {
  const rv = animate ? " reveal" : "";
  const st = (i) => (animate ? ` style="--i:${i}"` : "");

  return `${header({ animate })}
    <section aria-labelledby="kpi-title">
      <h2 class="sr-only" id="kpi-title">Headline metrics</h2>
      <ul class="stats__grid stats__grid--3" role="list">
        ${data.kpis.map((k, i) => statCard(k, i, animate)).join("")}
      </ul>
    </section>

    <div class="layout-row layout-row--split">
      <section class="card${rv}"${st(4)} aria-labelledby="rev-title">
        <header class="card__head">
          <div><p class="eyebrow">Revenue</p><h2 class="card__title" id="rev-title">Revenue and forecast</h2></div>
          <div data-select="granularity"></div>
        </header>
        <div class="figure">
          <p class="figure__value">${formatCurrency(data.revenue.total)}</p>
          ${trendMarkup(data.revenue.trend, "against previous period")}
        </div>
        <div class="chart" data-chart="revenue" tabindex="0" role="group" aria-label="Revenue chart. Use left and right arrow keys to read each period."></div>
        <ol class="chart-axis" role="list" aria-hidden="true">${data.revenue.points.map((p) => `<li>${esc(p.label)}</li>`).join("")}</ol>
      </section>

      <section class="card completion${rv}"${st(5)} aria-labelledby="completion-title">
        <header class="card__head">
          <div><p class="eyebrow">Delivery</p><h2 class="card__title" id="completion-title">Project completion</h2></div>
        </header>
        <div class="completion__chart" data-bars></div>
        <div class="completion__summary">
          <p class="completion__value">${data.completion.average}%</p>
          <p class="completion__label">average completion rate</p>
          ${trendMarkup(data.completion.trend, "")}
        </div>
      </section>
    </div>

    <section class="card${rv}"${st(6)} style="margin-top:var(--space-4)" aria-labelledby="team-title">
      <header class="card__head">
        <div><p class="eyebrow">Capacity</p><h2 class="card__title" id="team-title">Team performance</h2></div>
        <button class="link-action" type="button" data-export>Export report ${icon("arrow-up-right", { size: 14 })}</button>
      </header>
      <ul class="perf-list" role="list">
        ${data.team
          .map(
            (m, i) => `
          <li class="perf-row">
            <div class="perf-person">
              <span class="avatar avatar--lg${m.tone ? ` avatar--${m.tone}` : ""}" aria-hidden="true">${initials(m.name)}</span>
              <div><p class="perf-person__name">${esc(m.name)}</p><p class="perf-person__role">${esc(m.role)}</p></div>
            </div>
            <dl class="perf-metric perf-metric--tasks"><dt>Tasks completed</dt><dd>${m.tasks}</dd></dl>
            <dl class="perf-metric perf-metric--ontime"><dt>On-time rate</dt><dd>${m.onTime}%</dd></dl>
            <div class="perf-util">
              <div class="meter${m.tone ? ` meter--${m.tone}` : ""}" role="progressbar" aria-label="${esc(m.name)} utilization" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${m.utilization}">
                <span class="meter__label" aria-hidden="true">Utilization</span>
                <span class="meter__track"><span class="meter__fill" style="--value:${m.utilization}%;animation-delay:${i * 80}ms"></span></span>
                <span class="meter__value" aria-hidden="true">${m.utilization}%</span>
              </div>
            </div>
          </li>`,
          )
          .join("")}
      </ul>
    </section>`;
}

export function render(outlet) {
  let alive = true;
  let first = true;
  let pendingFocus = null;
  const state = { range: "may", granularity: "monthly" };

  function mount(data) {
    mountSelectMenu(outlet.querySelector('[data-select="range"]'), {
      label: "Date range",
      options: data.ranges,
      value: state.range,
      icon: "calendar",
      onChange: (value) => {
        state.range = value;
        pendingFocus = "range";
        load();
      },
    });
    mountSelectMenu(outlet.querySelector('[data-select="granularity"]'), {
      label: "Revenue interval",
      options: data.granularities,
      value: state.granularity,
      onChange: (value) => {
        state.granularity = value;
        pendingFocus = "granularity";
        load();
      },
    });

    renderAreaChart(outlet.querySelector("[data-chart=revenue]"), {
      points: data.revenue.points,
      format: formatCurrency,
      seriesLabel: "Revenue",
    });
    renderBarChart(outlet.querySelector("[data-bars]"), {
      bars: data.completion.bars,
      label: "Project completion by day of week",
    });
    animateStats(outlet, data.kpis);

    outlet.querySelector("[data-export]").addEventListener("click", () => {
      toast("Preparing your team performance report…", { type: "info" });
      setTimeout(() => {
        if (alive) toast("Team performance report exported.");
      }, 1400);
    });

    if (pendingFocus) {
      outlet.querySelector(`[data-select="${pendingFocus}"] button`)?.focus();
      pendingFocus = null;
    }
  }

  async function load() {
    if (first) outlet.innerHTML = skeleton();
    else outlet.classList.add("is-refreshing");

    try {
      const data = await repository.getAnalytics(state);
      if (!alive) return;
      outlet.classList.remove("is-refreshing");
      outlet.innerHTML = content(data, first);
      first = false;
      mount(data);
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.classList.remove("is-refreshing");
      outlet.innerHTML =
        header({ withRange: false, animate: false }) + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", () => {
        first = true;
        load();
      });
    }
  }

  load();
  return () => {
    alive = false;
  };
}
