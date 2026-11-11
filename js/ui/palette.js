import { NAV_ITEMS, QUICK_ACTIONS } from "../config/navigation.js";
import { icon } from "./icons.js";
import { esc } from "../utils/format.js";
import { toast } from "./toast.js";

const ITEMS = [
  ...NAV_ITEMS.map((item) => ({
    id: item.id,
    label: `Go to ${item.label}`,
    desc: `Open the ${item.label.toLowerCase()} workspace`,
    tag: "Navigate",
    path: item.path,
  })),
  ...QUICK_ACTIONS.map((action) => ({ ...action, tag: "Action" })),
];

let dialog,
  input,
  list,
  results = [],
  active = 0;

function build() {
  dialog = document.createElement("dialog");
  dialog.className = "palette";
  dialog.setAttribute("aria-label", "Command palette");
  dialog.innerHTML = `
    <div class="palette__search">
      ${icon("search", { size: 20 })}
      <input class="palette__input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list"
             aria-autocomplete="list" aria-label="Search pages and actions" placeholder="Search pages and actions..."
             autocomplete="off" spellcheck="false">
      <kbd class="kbd">ESC</kbd>
    </div>
    <ul class="palette__list" id="palette-list" role="listbox" aria-label="Results"></ul>
    <div class="palette__foot">
      <kbd class="kbd" aria-hidden="true">↑</kbd><kbd class="kbd" aria-hidden="true">↓</kbd><span>to navigate</span>
      <span class="spacer"></span>
      <kbd class="kbd" aria-hidden="true">↵</kbd><span>to select</span>
    </div>`;
  document.body.append(dialog);

  input = dialog.querySelector(".palette__input");
  list = dialog.querySelector(".palette__list");

  input.addEventListener("input", () => filter(input.value));
  input.addEventListener("keydown", onKeydown);
  list.addEventListener("click", (e) => {
    const row = e.target.closest("[data-index]");
    if (row) choose(Number(row.dataset.index));
  });
  list.addEventListener("pointermove", (e) => {
    const row = e.target.closest("[data-index]");
    if (row && Number(row.dataset.index) !== active)
      setActive(Number(row.dataset.index), false);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}

function filter(query) {
  const q = query.trim().toLowerCase();
  results = q
    ? ITEMS.filter((i) => `${i.label} ${i.desc}`.toLowerCase().includes(q))
    : ITEMS;
  active = 0;
  if (!results.length) {
    list.innerHTML = `<li class="palette__empty" role="presentation">No results for “${esc(query)}”. Try “projects” or “create”.</li>`;
    input.removeAttribute("aria-activedescendant");
    return;
  }
  list.innerHTML = results
    .map(
      (item, i) => `
    <li class="palette__item" role="option" id="palette-opt-${i}" data-index="${i}" aria-selected="${i === 0}">
      <span class="icon-chip" aria-hidden="true">${icon("command", { size: 14 })}</span>
      <span><span class="palette__title">${esc(item.label)}</span><span class="palette__desc">${esc(item.desc)}</span></span>
      <span class="palette__tag">${item.tag}</span>
    </li>`,
    )
    .join("");
  input.setAttribute("aria-activedescendant", "palette-opt-0");
}

function setActive(index, scroll = true) {
  if (!results.length) return;
  active = (index + results.length) % results.length;
  list
    .querySelectorAll("[role=option]")
    .forEach((row, i) =>
      row.setAttribute("aria-selected", String(i === active)),
    );
  input.setAttribute("aria-activedescendant", `palette-opt-${active}`);
  if (scroll)
    list
      .querySelector(`#palette-opt-${active}`)
      ?.scrollIntoView({ block: "nearest" });
}

function choose(index) {
  const item = results[index];
  if (!item) return;
  dialog.close();
  if (item.path) location.hash = item.path;
  else
    toast(`${item.label} will be available once that page is built.`, {
      type: "info",
    });
}

function onKeydown(e) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActive(active + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActive(active - 1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    choose(active);
  }
}

export function openPalette(query = "") {
  if (!dialog) build();
  if (!dialog.open) dialog.showModal();
  input.value = query;
  filter(query);
  input.focus();
}

export function initPalette() {
  const isTyping = (el) =>
    el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable);
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (dialog?.open) dialog.close();
      else openPalette();
    } else if (
      e.key === "/" &&
      !isTyping(document.activeElement) &&
      !dialog?.open
    ) {
      e.preventDefault();
      openPalette();
    }
  });
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-palette-open]");
    if (trigger) openPalette(trigger.dataset.paletteQuery ?? "");
  });
}
