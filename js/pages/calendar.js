import { repository } from "../data/repository.js";
import { icon } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { mountSelectMenu } from "../ui/select-menu.js";
import { esc } from "../utils/format.js";

const WEEKDAYS = [
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
  ["Sun", "Sunday"],
];

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const longDate = (d) =>
  d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

function monthOptions(today) {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(y, m - 1 - 2 + i, 1);
    return {
      value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  });
}

function header() {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Planning</p>
        <h1 class="page-title">Calendar</h1>
        <p class="page-sub">A shared view of project moments, deadlines, and team commitments.</p>
      </div>
      <button class="btn btn--primary" type="button" data-add>${icon("plus", { size: 16 })}New event</button>
    </header>`;
}

function skeleton() {
  return `${header()}
    <div class="card" aria-busy="true" aria-label="Loading calendar"><div class="skeleton" style="height:30rem"></div></div>`;
}

function errorState() {
  return `<div class="card state-panel" role="alert">
    <span class="icon-chip">${icon("alert", { size: 20 })}</span>
    <h2 class="state-panel__title">We couldn’t load your calendar</h2>
    <p class="state-panel__text">Something went wrong while fetching events. Check your connection and try again.</p>
    <button class="btn btn--secondary" type="button" data-retry>Try again</button>
  </div>`;
}

function gridMarkup(monthValue, byDate, today, selected) {
  const [y, m] = monthValue.split("-").map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday-first
  const days = new Date(y, m, 0).getDate();
  const weeks = Math.ceil((offset + days) / 7);
  const caption = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const rows = Array.from({ length: weeks }, (_, w) => {
    const cells = Array.from({ length: 7 }, (_, c) => {
      const d = new Date(y, m - 1, 1 - offset + w * 7 + c);
      const key = iso(d);
      const events = byDate[key] ?? [];
      const classes = [
        d.getMonth() !== m - 1 ? "is-outside" : "",
        key === selected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const label = `${longDate(d)}${events.length ? `, ${events.length} event${events.length === 1 ? "" : "s"}` : ""}`;
      return `
        <td${classes ? ` class="${classes}"` : ""}${events.length ? " data-has-events" : ""}>
          <button class="cal__day${key === today ? " cal__day--today" : ""}" type="button" data-date="${key}"
                  aria-label="${esc(label)}"${key === today ? ' aria-current="date"' : ""}${key === selected ? ' aria-pressed="true"' : ""}>${d.getDate()}</button>
          ${events.length ? `<ul class="cal__events" role="list">${events.map((e) => `<li class="cal__event">${esc(e.title)}</li>`).join("")}</ul>` : ""}
        </td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  return `
    <table class="cal">
      <caption class="sr-only">Calendar for ${caption}</caption>
      <thead><tr>${WEEKDAYS.map(([short, long]) => `<th scope="col"><abbr title="${long}">${short}</abbr></th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function render(outlet) {
  let alive = true;

  async function load() {
    outlet.innerHTML = skeleton();
    try {
      const data = await repository.getCalendar();
      if (!alive) return;
      mount(data);
    } catch (error) {
      if (!alive) return;
      console.error(error);
      outlet.innerHTML = header() + errorState();
      outlet.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  function mount({ today, events }) {
    const byDate = events.reduce((acc, e) => {
      (acc[e.date] ??= []).push(e);
      return acc;
    }, {});
    const options = monthOptions(today);
    const state = { month: today.slice(0, 7), selected: null };

    outlet.innerHTML = `${header()}
      <section class="card calendar reveal" aria-label="Month calendar">
        <div class="calendar__bar"><div data-month></div></div>
        <div data-grid></div>
        <section class="agenda" aria-live="polite" data-agenda hidden></section>
      </section>`;

    const gridEl = outlet.querySelector("[data-grid]");
    const agendaEl = outlet.querySelector("[data-agenda]");

    function renderGrid() {
      gridEl.innerHTML = gridMarkup(state.month, byDate, today, state.selected);
    }

    function renderAgenda() {
      if (!state.selected) {
        agendaEl.hidden = true;
        return;
      }
      const d = new Date(`${state.selected}T00:00:00`);
      const list = byDate[state.selected] ?? [];
      agendaEl.hidden = false;
      agendaEl.innerHTML = `
        <h2 class="agenda__title">${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
        ${
          list.length
            ? `<ul class="agenda__list" role="list">${list.map((e) => `<li class="agenda__item">${icon("calendar", { size: 16 })}${esc(e.title)}</li>`).join("")}</ul>`
            : '<p class="agenda__empty">No events scheduled for this day.</p>'
        }`;
    }

    mountSelectMenu(outlet.querySelector("[data-month]"), {
      label: "Month",
      options,
      value: state.month,
      align: "start",
      onChange: (value) => {
        state.month = value;
        state.selected = null;
        renderGrid();
        renderAgenda();
      },
    });

    gridEl.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-date]");
      if (!btn) return;
      state.selected =
        state.selected === btn.dataset.date ? null : btn.dataset.date;
      renderGrid();
      renderAgenda();
      gridEl
        .querySelector(`[data-date="${state.selected ?? btn.dataset.date}"]`)
        ?.focus();
    });

    outlet.addEventListener("click", (event) => {
      if (event.target.closest("[data-add]"))
        toast("New event will be available once the form is built.", {
          type: "info",
        });
    });

    renderGrid();
  }

  load();
  return () => {
    alive = false;
  };
}
