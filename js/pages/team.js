import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { mountSelectMenu } from "../ui/select-menu.js";
import { renderDonut } from "../charts/donut-chart.js";
import { esc, initials } from "../utils/format.js";

const STATUS = {
  available: { label: "Available", badge: " badge--success" },
  focus: { label: "Focus time", badge: " badge--warning" },
  meeting: { label: "In a meeting", badge: " badge--warning" },
  away: { label: "Away", badge: "" },
};
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({
  value,
  label: s.label,
}));

const toneClass = (t) => (t ? ` avatar--${t}` : "");
const meterClass = (t) => (t ? ` meter--${t}` : "");

function header() {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">People</p>
        <h1 class="page-title">Team</h1>
        <p class="page-sub">Keep capacity, expertise, and momentum visible across your organization.</p>
      </div>
      <button class="btn btn--primary" type="button" data-add>${icon("plus", { size: 16 })}Invite member</button>
    </header>`;
}

function skeleton() {
  const card = (h) =>
    `<div class="card"><div class="skeleton" style="height:${h}"></div></div>`;
  return `${header()}
    <div aria-busy="true" aria-label="Loading team">
      <div class="layout-row layout-row--split" style="margin-top:0">${card("16rem")}${card("16rem")}</div>
      <div class="team-grid" style="margin-top:var(--space-6)">${[0, 1, 2].map(() => card("14rem")).join("")}</div>
    </div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your team</h2>
    <p class="state-panel__text">Something went wrong while fetching team records. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

function workloadRows(members) {
  return members
    .slice(0, 5)
    .map(
      (m) => `
    <li class="workload__row">
      <span class="avatar${toneClass(m.tone)}" aria-hidden="true">${initials(m.name)}</span>
      <span class="workload__name">${esc(m.name)}</span>
      <div class="meter${meterClass(m.loadTone)}" role="progressbar" aria-label="${esc(m.name)} workload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${m.workload}">
        <span class="meter__track"><span class="meter__fill" style="--value:${m.workload}%"></span></span>
        <span class="meter__value" aria-hidden="true">${m.workload}%</span>
      </div>
    </li>`,
    )
    .join("");
}

function pulseMarkup(members) {
  const count = (...keys) =>
    members.filter((m) => keys.includes(m.status)).length;
  const rows = [
    { dot: "success", label: "Available", n: count("available") },
    { dot: "warning", label: "Focus / meeting", n: count("focus", "meeting") },
    { dot: "muted", label: "Away", n: count("away") },
  ];
  return `
    <p class="pulse__value">${rows[0].n}</p>
    <p class="pulse__label">members available now</p>
    <dl class="legend">
      ${rows.map((r) => `<div class="legend__row"><dt><span class="dot dot--${r.dot}" aria-hidden="true"></span>${r.label}</dt><dd>${r.n}</dd></div>`).join("")}
    </dl>`;
}

function memberCard(m) {
  const s = STATUS[m.status];
  return `
    <li>
      <article class="card member">
        <div class="member__top">
          <span class="avatar avatar--lg${toneClass(m.tone)}" aria-hidden="true">${initials(m.name)}</span>
          <div data-menu="${esc(m.id)}"></div>
        </div>
        <div>
          <h3 class="member__name">${esc(m.name)}</h3>
          <p class="member__role">${esc(m.role)}</p>
        </div>
        <span class="badge${s.badge}">${s.label}</span>
        <div>
          <p class="member__load">Workload <strong>${m.workload}%</strong></p>
          <div class="meter${meterClass(m.loadTone)}" role="progressbar" aria-label="${esc(m.name)} workload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${m.workload}">
            <span class="meter__track"><span class="meter__fill" style="--value:${m.workload}%"></span></span>
          </div>
        </div>
        <footer class="member__foot">
          <span>${m.projects} active projects</span>
          <button class="link-action" type="button" data-profile>Profile ${icon("chevron", { size: 14 })}</button>
        </footer>
      </article>
    </li>`;
}

function content(team) {
  return `${header()}
    <div class="layout-row layout-row--split" style="margin-top:0">
      <section class="card reveal" style="--i:1" aria-labelledby="workload-title">
        <header class="card__head">
          <div><p class="eyebrow">Capacity</p><h2 class="card__title" id="workload-title">Team workload</h2></div>
          <span class="card__meta">This week</span>
        </header>
        <div class="workload">
          <div class="donut" data-donut role="img" aria-label="${team.utilization}% average utilization"></div>
          <ul class="workload__list" role="list">${workloadRows(team.members)}</ul>
        </div>
      </section>

      <section class="card pulse reveal" style="--i:2" aria-labelledby="pulse-title">
        <header class="card__head">
          <div><p class="eyebrow">Availability</p><h2 class="card__title" id="pulse-title">Team pulse</h2></div>
          <button class="icon-btn" type="button" aria-label="Team pulse options">${icon("more")}</button>
        </header>
        <div class="pulse__body" aria-live="polite" data-pulse></div>
        <button class="btn btn--secondary btn--block" type="button" data-plan>View resource plan ${icon("arrow-up-right", { size: 14 })}</button>
      </section>
    </div>

    <div class="section-head reveal" style="--i:3">
      <p class="eyebrow">Directory</p>
      <h2>People and roles</h2>
    </div>
    <ul class="team-grid" role="list" data-directory></ul>`;
}

export function render(outlet) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton();
    try {
      const team = await repository.getTeam();
      if (!alive) return;
      outlet.innerHTML = content(team);
      mount(team);
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header() + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  function mount(team) {
    const pulseEl = outlet.querySelector("[data-pulse]");
    const dirEl = outlet.querySelector("[data-directory]");

    renderDonut(outlet.querySelector("[data-donut]"), {
      segments: [{ tone: "brand", pct: team.utilization }],
      value: `${team.utilization}%`,
      label: "avg. utilization",
    });

    function renderPulse() {
      pulseEl.innerHTML = pulseMarkup(team.members);
    }

    function renderDirectory(focusId) {
      dirEl.innerHTML = team.members.map(memberCard).join("");
      dirEl.querySelectorAll("[data-menu]").forEach((host) => {
        const m = team.members.find((x) => x.id === host.dataset.menu);
        mountSelectMenu(host, {
          label: `Set status for ${m.name}`,
          options: STATUS_OPTIONS,
          value: m.status,
          icon: "more",
          iconOnly: true,
          className: "select-menu--ghost",
          onChange: (status) => setStatus(m.id, status),
        });
      });
      if (focusId)
        dirEl
          .querySelector(`[data-menu="${CSS.escape(focusId)}"] button`)
          ?.focus();
    }

    async function setStatus(id, status) {
      const member = team.members.find((m) => m.id === id);
      const previous = member.status;
      member.status = status;
      renderPulse();
      renderDirectory(id);
      try {
        await repository.updateMemberStatus(id, status);
        if (alive)
          toast(`${member.name} is now ${STATUS[status].label.toLowerCase()}.`);
      } catch (error) {
        console.error(error);
        if (!alive) return;
        member.status = previous;
        renderPulse();
        renderDirectory(id);
        toast(`Couldn’t update ${member.name}’s status. Please try again.`, {
          type: "error",
        });
      }
    }

    outlet.addEventListener("click", (event) => {
      if (event.target.closest("[data-add]"))
        toast(
          "Invite member will be available once the invitation flow is built.",
          { type: "info" },
        );
      if (event.target.closest("[data-plan]"))
        toast("The resource plan is coming next.", { type: "info" });
      if (event.target.closest("[data-profile]"))
        toast("Member profiles are coming next.", { type: "info" });
    });

    renderPulse();
    renderDirectory();
  }

  load();
  return () => {
    alive = false;
  };
}
