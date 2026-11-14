import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { syncBanner, bindSyncBanner } from "../ui/sync-banner.js";
import { mountSelectMenu } from "../ui/select-menu.js";
import { prefersReducedMotion } from "../utils/motion.js";
import { esc, initials, formatCurrency } from "../utils/format.js";

const STATUS = {
  active: { label: "Active", badge: "success" },
  "at-risk": { label: "At risk", badge: "warning" },
  prospect: { label: "Prospect", badge: "rose" },
};
const FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "at-risk", label: "At risk" },
  { value: "prospect", label: "Prospect" },
];

const avatarTone = (tone) => (tone ? ` avatar--${tone}` : "");
const meterTone = (tone) => (tone ? ` meter--${tone}` : "");

function header(animate = true) {
  return `
    <header class="page-head${animate ? " reveal" : ""}">
      <div>
        <p class="eyebrow">CRM</p>
        <h1 class="page-title">Customers</h1>
        <p class="page-sub">Understand every relationship, opportunity, and moment that matters.</p>
      </div>
      <button class="btn btn--primary" type="button" data-add>${icon("plus", { size: 16 })}Add customer</button>
    </header>`;
}

function skeleton() {
  const card = (h) =>
    `<div class="card"><div class="skeleton" style="height:${h}"></div></div>`;
  return `${header(false)}
    <div aria-busy="true" aria-label="Loading customers">
      <div class="layout-row layout-row--split">${card("26rem")}${card("26rem")}</div>
    </div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your customers</h2>
    <p class="state-panel__text">Something went wrong while fetching customer records. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

function rowMarkup(c, selected) {
  const st = STATUS[c.status];
  return `
    <li>
      <button class="record-row" type="button" data-id="${esc(c.id)}"${c.id === selected ? ' aria-current="true"' : ""}>
        <span class="avatar avatar--lg${avatarTone(c.tone)}" aria-hidden="true">${initials(c.name)}</span>
        <span><span class="record-row__name">${esc(c.name)}</span><span class="record-row__meta">${esc(c.industry)}</span></span>
        <span class="record-row__side">
          <span class="badge badge--${st.badge}">${st.label}</span>
          <span class="record-row__value"><span class="sr-only">Lifetime value </span>${formatCurrency(c.value)}</span>
        </span>
        ${icon("chevron", { size: 16 })}
      </button>
    </li>`;
}

function profileMarkup(c) {
  const st = STATUS[c.status];
  const work = c.work.length
    ? `<ul class="work-list" role="list">${c.work
        .map(
          (w) => `
        <li class="work-item">
          <p class="work-item__title">${esc(w.title)}</p>
          <p class="work-item__pct">${w.progress}%</p>
          <p class="work-item__meta">${esc(w.state)} · Due ${esc(w.due)}</p>
          <div class="meter${meterTone(w.tone)}" role="progressbar" aria-label="${esc(w.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${w.progress}">
            <span class="meter__track"><span class="meter__fill" style="--value:${w.progress}%"></span></span>
          </div>
        </li>`,
        )
        .join("")}</ul>`
    : `<p class="profile__empty">No active work yet. Create a project to get started.</p>`;

  return `
    <div class="profile__head">
      <span class="avatar avatar--xl${avatarTone(c.tone)}" aria-hidden="true">${initials(c.name)}</span>
      <div>
        <p class="eyebrow">Customer profile</p>
        <h2 class="profile__name">${esc(c.name)}</h2>
        <p class="profile__meta">${esc(c.industry)} · Est. ${c.founded}</p>
      </div>
      <button class="icon-btn profile__more" type="button" aria-label="Customer options">${icon("more")}</button>
    </div>

    <div class="profile__health">
      <div><p class="profile__label">Relationship health</p><p class="profile__strong">${esc(c.health)}</p></div>
      <span class="badge badge--${st.badge}">${st.label}</span>
    </div>

    <dl class="profile__section metrics">
      <div><dt>Lifetime value</dt><dd>${formatCurrency(c.value)}</dd></div>
      <div><dt>Open projects</dt><dd>${c.work.length}</dd></div>
      <div><dt>Last touch</dt><dd>${esc(c.lastTouch)}</dd></div>
    </dl>

    <div class="profile__section">
      <p class="eyebrow">Next moment</p>
      <a class="next" href="#/calendar">
        ${icon("calendar", { size: 18 })}
        <span><strong>${esc(c.next.title)} · ${esc(c.next.date)}</strong><small>Owner: ${esc(c.next.owner)}</small></span>
        ${icon("chevron", { size: 16 })}
      </a>
    </div>

    <div class="profile__section">
      <p class="eyebrow">Active work</p>
      ${work}
    </div>

    <button class="btn btn--secondary btn--block" type="button" data-open-profile>Open customer profile ${icon("arrow-up-right", { size: 14 })}</button>`;
}

function content(session, data) {
  return `${header()}
    ${session.live ? "" : syncBanner({ label: "Live customers", message: "Sign in to use persistent customers records." })}
    <div class="layout-row layout-row--split">
      <section class="card card--flush reveal" style="--i:1" aria-labelledby="customer-list-title">
        <h2 class="sr-only" id="customer-list-title">Customer list</h2>
        <div class="customers__tools">
          <label class="search-field">
            <span class="sr-only">Search customers</span>${icon("search", { size: 16 })}
            <input type="search" placeholder="Search customers" autocomplete="off" data-search>
          </label>
          <div data-filter></div>
        </div>
        <p class="sr-only" role="status" data-status></p>
        <div data-list></div>
      </section>
      <section class="card profile reveal" style="--i:2" aria-label="Customer profile" aria-live="polite" data-profile></section>
    </div>`;
}

export function render(outlet, { session }) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton();
    try {
      const customers = await repository.getCustomers();
      if (!alive) return;
      outlet.innerHTML = content(session, customers);
      bindSyncBanner(outlet);
      mount(customers);
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header(false) + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  function mount(customers) {
    const state = { query: "", status: "all", selected: customers[0]?.id };
    const listEl = outlet.querySelector("[data-list]");
    const profileEl = outlet.querySelector("[data-profile]");
    const statusEl = outlet.querySelector("[data-status]");

    function renderList() {
      const q = state.query.trim().toLowerCase();
      const rows = customers.filter(
        (c) =>
          (state.status === "all" || c.status === state.status) &&
          (!q || `${c.name} ${c.industry}`.toLowerCase().includes(q)),
      );

      statusEl.textContent = `${rows.length} customer${rows.length === 1 ? "" : "s"} shown`;

      if (!rows.length) {
        listEl.innerHTML = `
          <div class="state-panel">
            <span class="icon-chip">${icon("search", { size: 20 })}</span>
            <h3 class="state-panel__title">No customers found</h3>
            <p class="state-panel__text">Nothing matches your search or filter. Try a different name or clear your filters.</p>
            <button class="btn btn--secondary" type="button" data-clear>Clear filters</button>
          </div>`;
        return;
      }
      listEl.innerHTML = `<ul class="record-list" role="list">${rows.map((c) => rowMarkup(c, state.selected)).join("")}</ul>`;
    }

    function renderProfile(animate = false) {
      const customer = customers.find((c) => c.id === state.selected);
      if (!customer) return;
      profileEl.innerHTML = profileMarkup(customer);
      if (animate && !prefersReducedMotion()) {
        profileEl.classList.remove("is-swapping");
        void profileEl.offsetWidth;
        profileEl.classList.add("is-swapping");
      }
    }

    const searchEl = outlet.querySelector("[data-search]");
    searchEl.addEventListener("input", () => {
      state.query = searchEl.value;
      renderList();
    });

    mountSelectMenu(outlet.querySelector("[data-filter]"), {
      label: "Filter by status",
      options: FILTERS,
      value: state.status,
      icon: "filter",
      iconOnly: true,
      onChange: (value) => {
        state.status = value;
        renderList();
      },
    });

    listEl.addEventListener("click", (event) => {
      const row = event.target.closest("[data-id]");
      if (row) {
        state.selected = row.dataset.id;
        renderList();
        listEl
          .querySelector(`[data-id="${CSS.escape(state.selected)}"]`)
          ?.focus();
        renderProfile(true);
        if (window.matchMedia("(max-width: 1100px)").matches) {
          profileEl.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
        }
      } else if (event.target.closest("[data-clear]")) {
        state.query = "";
        state.status = "all";
        searchEl.value = "";
        mountSelectMenu(outlet.querySelector("[data-filter]"), {
          label: "Filter by status",
          options: FILTERS,
          value: "all",
          icon: "filter",
          iconOnly: true,
          onChange: (value) => {
            state.status = value;
            renderList();
          },
        });
        renderList();
      }
    });

    outlet.addEventListener("click", (event) => {
      if (event.target.closest("[data-add]"))
        toast("Add customer will be available once the form is built.", {
          type: "info",
        });
      if (event.target.closest("[data-open-profile]"))
        toast("Full customer profile pages are coming next.", { type: "info" });
    });

    renderList();
    renderProfile();
  }

  load();
  return () => {
    alive = false;
  };
}
