import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { syncBanner, bindSyncBanner } from "../ui/sync-banner.js";
import { mountSelectMenu } from "../ui/select-menu.js";
import { esc, initials, formatShortDate } from "../utils/format.js";

const STATUSES = [
  { value: "planning", label: "Planning", dot: "muted", badge: "" },
  {
    value: "in-progress",
    label: "In progress",
    dot: "brand",
    badge: " badge--brand",
  },
  {
    value: "in-review",
    label: "In review",
    dot: "info",
    badge: " badge--info",
  },
  {
    value: "complete",
    label: "Complete",
    dot: "success",
    badge: " badge--success",
  },
];
const FILTERS = [
  { value: "all", label: "All projects" },
  ...STATUSES.map(({ value, label }) => ({ value, label })),
];
const SORTS = [
  { value: "default", label: "Default order" },
  { value: "due", label: "Due date" },
  { value: "progress", label: "Progress" },
  { value: "name", label: "Name" },
];
const SORTERS = {
  default: null,
  due: (a, b) => a.due.localeCompare(b.due),
  progress: (a, b) => b.progress - a.progress,
  name: (a, b) => a.name.localeCompare(b.name),
};

const tone = (t) => (t ? ` avatar--${t}` : "");
const meterTone = (t) => (t ? ` meter--${t}` : "");
const statusOf = (value) => STATUSES.find((s) => s.value === value);

function header() {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Delivery</p>
        <h1 class="page-title">Projects</h1>
        <p class="page-sub">Run cross-functional work with complete visibility from first brief to final handoff.</p>
      </div>
      <button class="btn btn--primary" type="button" data-add>${icon("plus", { size: 16 })}New project</button>
    </header>`;
}

function skeleton() {
  const col = `<div class="board__col"><div class="skeleton" style="height:1.25rem;width:40%"></div>${[
    0, 1,
  ]
    .map(
      () =>
        '<div class="card"><div class="skeleton" style="height:9rem"></div></div>',
    )
    .join("")}</div>`;
  return `${header()}
    <div aria-busy="true" aria-label="Loading projects"><div class="board">${col.repeat(4)}</div></div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your projects</h2>
    <p class="state-panel__text">Something went wrong while fetching project records. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

const teamMarkup = (team) => `
  <span class="avatar-group" role="img" aria-label="Team: ${esc(team.map((m) => m.name).join(", "))}">
    ${team.map((m) => `<span class="avatar${tone(m.tone)}" aria-hidden="true">${initials(m.name)}</span>`).join("")}
  </span>`;

const meterMarkup = (p, withValue = false) => `
  <div class="meter${meterTone(p.tone)}" role="progressbar" aria-label="${esc(p.name)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.progress}">
    <span class="meter__track"><span class="meter__fill" style="--value:${p.progress}%"></span></span>
    ${withValue ? `<span class="meter__value" aria-hidden="true">${p.progress}%</span>` : ""}
  </div>`;

function cardMarkup(p) {
  return `
    <li>
      <article class="card project-card">
        <div class="project-card__top">
          <span class="avatar tile${tone(p.tone)}" aria-hidden="true">${esc(p.name[0])}</span>
          <div data-menu="${esc(p.id)}"></div>
        </div>
        <div>
          <h3 class="project-card__title">${esc(p.name)}</h3>
          <p class="project-card__customer">${esc(p.customer)}</p>
        </div>
        <div>
          <div class="project-card__progress"><span>Progress</span><span class="project-card__pct">${p.progress}%</span></div>
          ${meterMarkup(p)}
        </div>
        <p class="milestone">${icon("target", { size: 14 })}<span><span class="sr-only">Next milestone: </span>${esc(p.milestone)}</span></p>
        <div class="project-card__foot">
          ${teamMarkup(p.team)}
          <time class="due" datetime="${p.due}"><span class="sr-only">Due </span>${icon("clock", { size: 13 })}${formatShortDate(p.due)}</time>
        </div>
      </article>
    </li>`;
}

function boardMarkup(list, animate) {
  return `<div class="board">${STATUSES.map((s, i) => {
    const items = list.filter((p) => p.status === s.value);
    return `
      <section class="board__col${animate ? " reveal" : ""}"${animate ? ` style="--i:${i}"` : ""} aria-labelledby="col-${s.value}">
        <header class="board__head">
          <h2 class="board__title" id="col-${s.value}"><span class="dot dot--${s.dot}" aria-hidden="true"></span>${s.label}</h2>
          <span class="count-pill" aria-label="${items.length} project${items.length === 1 ? "" : "s"}">${items.length}</span>
        </header>
        ${items.length ? `<ul class="board__list" role="list">${items.map(cardMarkup).join("")}</ul>` : '<p class="board__empty">No projects here.</p>'}
        <button class="add-slot" type="button" data-add>${icon("plus", { size: 14 })}Add project</button>
      </section>`;
  }).join("")}</div>`;
}

function tableMarkup(list) {
  if (!list.length) {
    return `<div class="card state-panel">
      <span class="icon-chip">${icon("projects", { size: 20 })}</span>
      <h2 class="state-panel__title">No projects found</h2>
      <p class="state-panel__text">No projects match this filter. Clear it to see everything in your workspace.</p>
      <button class="btn btn--secondary" type="button" data-clear>Clear filter</button>
    </div>`;
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <caption class="sr-only">Projects</caption>
        <thead><tr><th scope="col">Project</th><th scope="col">Status</th><th scope="col">Progress</th><th scope="col">Team</th><th scope="col">Due</th></tr></thead>
        <tbody>
          ${list
            .map((p) => {
              const s = statusOf(p.status);
              return `<tr>
              <th scope="row"><div class="project-cell">
                <span class="avatar tile${tone(p.tone)}" aria-hidden="true">${esc(p.name[0])}</span>
                <div><strong>${esc(p.name)}</strong><small>${esc(p.customer)}</small></div>
              </div></th>
              <td><span class="badge${s.badge}">${s.label}</span></td>
              <td>${meterMarkup(p, true)}</td>
              <td>${teamMarkup(p.team)}</td>
              <td><time class="due" datetime="${p.due}">${icon("clock", { size: 13 })}${formatShortDate(p.due)}</time></td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function content(session) {
  return `${header()}
    ${session.live ? "" : syncBanner({ label: "Live projects", message: "Sign in to use persistent projects records." })}
    <div class="toolbar">
      <div class="segmented" role="group" aria-label="View">
        <button class="segmented__btn" type="button" data-view-btn="board" aria-pressed="true">${icon("projects", { size: 15 })}Board</button>
        <button class="segmented__btn" type="button" data-view-btn="list" aria-pressed="false">${icon("list", { size: 15 })}List</button>
      </div>
      <div class="toolbar__group"><div data-filter></div><div data-sort></div></div>
    </div>
    <p class="sr-only" role="status" data-status></p>
    <div data-view></div>`;
}

export function render(outlet, { session }) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton();
    try {
      const projects = await repository.getProjects();
      if (!alive) return;
      outlet.innerHTML = content(session);
      bindSyncBanner(outlet);
      mount(projects);
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header() + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  function mount(projects) {
    const state = { view: "board", filter: "all", sort: "default" };
    const viewEl = outlet.querySelector("[data-view]");
    const statusEl = outlet.querySelector("[data-status]");
    let animate = true;

    const visible = () => {
      const list = projects.filter(
        (p) => state.filter === "all" || p.status === state.filter,
      );
      const sorter = SORTERS[state.sort];
      return sorter ? [...list].sort(sorter) : list;
    };

    function renderView(focusId) {
      const list = visible();
      statusEl.textContent = `${list.length} project${list.length === 1 ? "" : "s"} shown`;
      if (state.view === "board") {
        viewEl.innerHTML = boardMarkup(list, animate);
        viewEl.querySelectorAll("[data-menu]").forEach((host) => {
          const p = projects.find((x) => x.id === host.dataset.menu);
          mountSelectMenu(host, {
            label: `Move ${p.name} to`,
            options: STATUSES.map(({ value, label }) => ({ value, label })),
            value: p.status,
            icon: "more",
            iconOnly: true,
            className: "select-menu--ghost",
            onChange: (status) => moveProject(p.id, status),
          });
        });
      } else {
        viewEl.innerHTML = tableMarkup(list);
      }
      animate = false;
      if (focusId)
        viewEl
          .querySelector(`[data-menu="${CSS.escape(focusId)}"] button`)
          ?.focus();
    }

    async function moveProject(id, status) {
      const project = projects.find((p) => p.id === id);
      const previous = project.status;
      const label = statusOf(status).label;
      project.status = status;
      renderView(id);
      try {
        await repository.updateProjectStatus(id, status);
        if (!alive) return;
        statusEl.textContent = `${project.name} moved to ${label}.`;
        toast(`Moved “${project.name}” to ${label}.`);
      } catch (error) {
        console.error(error);
        if (!alive) return;
        project.status = previous;
        renderView(id);
        toast(`Couldn’t move “${project.name}”. Please try again.`, {
          type: "error",
        });
      }
    }

    mountSelectMenu(outlet.querySelector("[data-filter]"), {
      label: "Filter projects",
      buttonLabel: "Filter",
      options: FILTERS,
      value: state.filter,
      icon: "settings",
      chevron: false,
      collapseLabel: true,
      onChange: (value) => {
        state.filter = value;
        renderView();
      },
    });
    mountSelectMenu(outlet.querySelector("[data-sort]"), {
      label: "Sort projects",
      buttonLabel: "Sort",
      options: SORTS,
      value: state.sort,
      icon: "updown",
      chevron: false,
      collapseLabel: true,
      onChange: (value) => {
        state.sort = value;
        renderView();
      },
    });

    outlet.querySelectorAll("[data-view-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.view = btn.dataset.viewBtn;
        outlet
          .querySelectorAll("[data-view-btn]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        renderView();
      });
    });

    outlet.addEventListener("click", (event) => {
      if (event.target.closest("[data-add]"))
        toast("New project will be available once the form is built.", {
          type: "info",
        });
      if (event.target.closest("[data-clear]")) {
        state.filter = "all";
        mountSelectMenu(outlet.querySelector("[data-filter]"), {
          label: "Filter projects",
          buttonLabel: "Filter",
          options: FILTERS,
          value: "all",
          icon: "settings",
          chevron: false,
          collapseLabel: true,
          onChange: (value) => {
            state.filter = value;
            renderView();
          },
        });
        renderView();
      }
    });

    renderView();
  }

  load();
  return () => {
    alive = false;
  };
}
