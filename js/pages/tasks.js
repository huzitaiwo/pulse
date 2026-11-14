import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { syncBanner, bindSyncBanner } from "../ui/sync-banner.js";
import { mountSelectMenu } from "../ui/select-menu.js";
import { esc, initials, formatShortDate } from "../utils/format.js";

const STATUSES = [
  { value: "todo", label: "Todo", dot: "muted" },
  { value: "in-progress", label: "In progress", dot: "brand" },
  { value: "in-review", label: "In review", dot: "info" },
];
const PRIORITIES = [
  { value: "high", label: "High", dot: "danger", badge: " badge--rose" },
  { value: "medium", label: "Medium", dot: "warning", badge: " badge--warning" },
  { value: "low", label: "Low", dot: "muted", badge: "" },
];
const GROUPS = [
  { value: "status", label: "Group by status" },
  { value: "priority", label: "Group by priority" },
  { value: "assignee", label: "Group by assignee" },
  { value: "project", label: "Group by project" },
];
const DUE_FILTERS = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

const toneClass = (t) => (t ? ` avatar--${t}` : "");
const statusOf = (value) => STATUSES.find((s) => s.value === value);
const priorityOf = (value) => PRIORITIES.find((p) => p.value === value);
const dueState = (iso, today) => (iso < today ? "overdue" : iso === today ? "today" : "");
const keyOf = (t, group) =>
  group === "status" ? t.status : group === "priority" ? t.priority : group === "assignee" ? t.assignee.name : t.project;

function columnsFor(group, tasks) {
  if (group === "status") return STATUSES.map((s) => ({ key: s.value, label: s.label, dot: s.dot }));
  if (group === "priority") return PRIORITIES.map((p) => ({ key: p.value, label: p.label, dot: p.dot }));
  return [...new Set(tasks.map((t) => keyOf(t, group)))].sort().map((k) => ({ key: k, label: k, dot: "brand" }));
}

function header() {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Execution</p>
        <h1 class="page-title">Tasks</h1>
        <p class="page-sub">Turn strategy into clear, accountable next actions.</p>
      </div>
      <button class="btn btn--primary" type="button" data-add>${icon("plus", { size: 16 })}New task</button>
    </header>`;
}

function skeleton() {
  const col = `<div class="board__col"><div class="skeleton" style="height:1.25rem;width:40%"></div>${
    [0, 1].map(() => '<div class="card"><div class="skeleton" style="height:8rem"></div></div>').join("")}</div>`;
  return `${header()}
    <div aria-busy="true" aria-label="Loading tasks">
      <div class="card"><div class="skeleton" style="height:2.5rem"></div></div>
      <div class="board" style="--cols:3">${col.repeat(3)}</div>
    </div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your tasks</h2>
    <p class="state-panel__text">Something went wrong while fetching task records. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

const selectField = ({ id, label, options, value = "all" }) => `
  <label class="select-field">
    <span>${esc(label)}</span>
    <select data-filter="${id}">
      ${options.map((o) => `<option value="${esc(o.value)}"${o.value === value ? " selected" : ""}>${esc(o.label)}</option>`).join("")}
    </select>
    ${icon("chevdown", { size: 15 })}
  </label>`;

function dueMarkup(iso, today) {
  const state = dueState(iso, today);
  const label = state === "today" ? "Today" : formatShortDate(iso);
  const prefix = state === "overdue" ? "Overdue: " : "Due ";
  return `<time class="due${state ? ` due--${state}` : ""}" datetime="${iso}"><span class="sr-only">${prefix}</span>${icon("calendar", { size: 13 })}${label}</time>`;
}

function cardMarkup(t, today, draggable) {
  const p = priorityOf(t.priority);
  return `
    <li>
      <article class="card task-card" data-task="${esc(t.id)}"${draggable ? ' draggable="true"' : ""}>
        <div class="task-card__top">
          <span class="priority priority--${p.value}"><span class="badge${p.badge}"><span class="sr-only">Priority: </span>${p.label}</span></span>
          <div data-menu="${esc(t.id)}"></div>
        </div>
        <h3 class="task-card__title">${esc(t.title)}</h3>
        <p class="task-card__project">${esc(t.project)}</p>
        <div class="task-card__foot">
          ${dueMarkup(t.due, today)}
          <span class="avatar${toneClass(t.assignee.tone)}" role="img" aria-label="Assigned to ${esc(t.assignee.name)}">${initials(t.assignee.name)}</span>
        </div>
      </article>
    </li>`;
}

function boardMarkup(list, columns, group, today) {
  return `<div class="board" style="--cols:${columns.length}">${columns.map((c, i) => {
    const items = list.filter((t) => keyOf(t, group) === c.key);
    return `
      <section class="board__col" data-col="${esc(c.key)}" aria-labelledby="task-col-${i}">
        <header class="board__head">
          <h2 class="board__title" id="task-col-${i}"><span class="dot dot--${c.dot}" aria-hidden="true"></span>${esc(c.label)}</h2>
          <span class="count-pill" aria-label="${items.length} task${items.length === 1 ? "" : "s"}">${items.length}</span>
        </header>
        ${items.length ? `<ul class="board__list" role="list">${items.map((t) => cardMarkup(t, today, group === "status")).join("")}</ul>` : '<p class="board__empty">No tasks here.</p>'}
        <button class="add-slot" type="button" data-add>${icon("plus", { size: 14 })}Add task</button>
      </section>`;
  }).join("")}</div>`;
}

function emptyMarkup() {
  return `<div class="card state-panel" style="margin-top:var(--space-4)">
    <span class="icon-chip">${icon("tasks", { size: 20 })}</span>
    <h2 class="state-panel__title">No tasks match your view</h2>
    <p class="state-panel__text">Try a different search, or clear your filters to see every task in the workspace.</p>
    <button class="btn btn--secondary" type="button" data-clear>Clear filters</button>
  </div>`;
}

function content(session, data) {
  const people = [...new Set(data.tasks.map((t) => t.assignee.name))].sort();
  return `${header()}
    ${session.live ? "" : syncBanner({ label: "Live tasks", message: "Sign in to use persistent tasks records." })}
    <section class="card filter-bar" aria-label="Filter tasks">
      <div class="filter-bar__main">
        <label class="search-field">
          <span class="sr-only">Search tasks, projects, and assignees</span>${icon("search", { size: 16 })}
          <input type="search" placeholder="Search tasks, projects, and assignees" autocomplete="off" data-search>
        </label>
        ${selectField({ id: "status", label: "Status", options: [{ value: "all", label: "All" }, ...STATUSES] })}
        ${selectField({ id: "priority", label: "Priority", options: [{ value: "all", label: "All" }, ...PRIORITIES] })}
        <button class="btn btn--secondary filter-bar__more" type="button" aria-expanded="false" aria-controls="more-filters" data-more-toggle>
          ${icon("filter", { size: 16 })}<span>More filters</span>
        </button>
      </div>
      <div class="filter-bar__more-panel" id="more-filters" hidden>
        ${selectField({ id: "assignee", label: "Assignee", options: [{ value: "all", label: "All" }, ...people.map((n) => ({ value: n, label: n }))] })}
        ${selectField({ id: "due", label: "Due", options: DUE_FILTERS })}
      </div>
    </section>
    <div class="results-bar">
      <p role="status" data-count></p>
      <div data-group></div>
    </div>
    <div data-view></div>`;
}

export function render(outlet, { session }) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton();
    try {
      const data = await repository.getTasks();
      if (!alive) return;
      outlet.innerHTML = content(session, data);
      bindSyncBanner(outlet);
      mount(data);
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header() + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  function mount({ today, tasks }) {
    const f = { query: "", status: "all", priority: "all", assignee: "all", due: "all", group: "status" };
    const viewEl = outlet.querySelector("[data-view]");
    const countEl = outlet.querySelector("[data-count]");
    let dragId = null;

    const matches = (t) => {
      const q = f.query.trim().toLowerCase();
      if (q && !`${t.title} ${t.project} ${t.assignee.name}`.toLowerCase().includes(q)) return false;
      if (f.status !== "all" && t.status !== f.status) return false;
      if (f.priority !== "all" && t.priority !== f.priority) return false;
      if (f.assignee !== "all" && t.assignee.name !== f.assignee) return false;
      if (f.due !== "all") {
        const s = dueState(t.due, today);
        if (f.due === "overdue" && s !== "overdue") return false;
        if (f.due === "today" && s !== "today") return false;
        if (f.due === "upcoming" && s !== "") return false;
      }
      return true;
    };

    function renderView(focusId) {
      const list = tasks.filter(matches);
      countEl.innerHTML = `<strong>${list.length}</strong> task${list.length === 1 ? "" : "s"} matching your view`;

      if (!list.length) {
        viewEl.innerHTML = emptyMarkup();
        return;
      }
      viewEl.innerHTML = boardMarkup(list, columnsFor(f.group, tasks), f.group, today);
      viewEl.querySelectorAll("[data-menu]").forEach((host) => {
        const t = tasks.find((x) => x.id === host.dataset.menu);
        mountSelectMenu(host, {
          label: `Move ${t.title} to`,
          options: STATUSES.map(({ value, label }) => ({ value, label })),
          value: t.status,
          icon: "more",
          iconOnly: true,
          className: "select-menu--ghost",
          onChange: (status) => moveTask(t.id, status),
        });
      });
      if (focusId) viewEl.querySelector(`[data-menu="${CSS.escape(focusId)}"] button`)?.focus();
    }

    async function moveTask(id, status) {
      const task = tasks.find((t) => t.id === id);
      if (!task || task.status === status) return;
      const previous = task.status;
      const label = statusOf(status).label;
      task.status = status;
      renderView(id);
      try {
        await repository.updateTaskStatus(id, status);
        if (alive) toast(`Moved “${task.title}” to ${label}.`);
      } catch (error) {
        console.error(error);
        if (!alive) return;
        task.status = previous;
        renderView(id);
        toast(`Couldn’t move “${task.title}”. Please try again.`, { type: "error" });
      }
    }

    // Filters
    const searchEl = outlet.querySelector("[data-search]");
    searchEl.addEventListener("input", () => { f.query = searchEl.value; renderView(); });
    outlet.querySelectorAll("[data-filter]").forEach((select) => {
      select.addEventListener("change", () => { f[select.dataset.filter] = select.value; renderView(); });
    });

    const moreToggle = outlet.querySelector("[data-more-toggle]");
    const morePanel = outlet.querySelector("#more-filters");
    moreToggle.addEventListener("click", () => {
      const open = morePanel.hidden;
      morePanel.hidden = !open;
      moreToggle.setAttribute("aria-expanded", String(open));
    });

    mountSelectMenu(outlet.querySelector("[data-group]"), {
      label: "Group tasks",
      options: GROUPS,
      value: f.group,
      icon: "circleCheck",
      onChange: (value) => { f.group = value; renderView(); },
    });

    // Drag and drop (status grouping only; the card menu is the keyboard/touch alternative)
    viewEl.addEventListener("dragstart", (e) => {
      const card = e.target.closest("[data-task]");
      if (!card || f.group !== "status") return;
      dragId = card.dataset.task;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", dragId);
      card.classList.add("is-dragging");
    });
    viewEl.addEventListener("dragend", () => {
      dragId = null;
      viewEl.querySelectorAll(".is-dragging, .is-over").forEach((el) => el.classList.remove("is-dragging", "is-over"));
    });
    viewEl.addEventListener("dragover", (e) => {
      const col = e.target.closest("[data-col]");
      if (!dragId || !col || f.group !== "status") return;
      e.preventDefault();
      col.classList.add("is-over");
    });
    viewEl.addEventListener("dragleave", (e) => {
      const col = e.target.closest("[data-col]");
      if (col && !col.contains(e.relatedTarget)) col.classList.remove("is-over");
    });
    viewEl.addEventListener("drop", (e) => {
      const col = e.target.closest("[data-col]");
      if (!dragId || !col || f.group !== "status") return;
      e.preventDefault();
      const id = dragId;
      dragId = null;
      col.classList.remove("is-over");
      moveTask(id, col.dataset.col);
    });

    outlet.addEventListener("click", (event) => {
      if (event.target.closest("[data-add]")) toast("New task will be available once the form is built.", { type: "info" });
      if (event.target.closest("[data-clear]")) {
        Object.assign(f, { query: "", status: "all", priority: "all", assignee: "all", due: "all" });
        searchEl.value = "";
        outlet.querySelectorAll("[data-filter]").forEach((select) => { select.value = "all"; });
        renderView();
      }
    });

    renderView();
  }

  load();
  return () => { alive = false; };
}