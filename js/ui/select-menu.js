import { icon } from "./icons.js";
import { esc } from "../utils/format.js";

let uid = 0;

/** Accessible dropdown. mountSelectMenu(hostEl, { label, options: [{ value, label }], value, icon, onChange }) */
export function mountSelectMenu(
  host,
  { label, options, value, icon: leading, onChange },
) {
  const id = `select-menu-${++uid}`;
  let selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  let active = selected;

  host.classList.add("select-menu");
  host.innerHTML = `
    <button class="select-menu__button" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"
            aria-label="${esc(label)}: ${esc(options[selected].label)}">
      ${leading ? icon(leading, { size: 15 }) : ""}<span>${esc(options[selected].label)}</span>${icon("chevdown", { size: 15 })}
    </button>
    <ul class="select-menu__list" id="${id}" role="listbox" aria-label="${esc(label)}" tabindex="-1" hidden>
      ${options
        .map(
          (o, i) => `
        <li class="select-menu__option" role="option" id="${id}-${i}" data-index="${i}" aria-selected="${i === selected}">
          <span>${esc(o.label)}</span>${i === selected ? icon("check", { size: 14 }) : ""}
        </li>`,
        )
        .join("")}
    </ul>`;

  const button = host.querySelector("button");
  const list = host.querySelector("ul");

  const setActive = (i) => {
    active = (i + options.length) % options.length;
    list
      .querySelectorAll("[role=option]")
      .forEach((el, n) => el.classList.toggle("is-active", n === active));
    list.setAttribute("aria-activedescendant", `${id}-${active}`);
  };
  const outside = (e) => {
    if (!host.contains(e.target)) close(false);
  };
  const open = () => {
    list.hidden = false;
    button.setAttribute("aria-expanded", "true");
    setActive(selected);
    list.focus();
    document.addEventListener("pointerdown", outside, true);
  };
  const close = (refocus = true) => {
    list.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    if (refocus) button.focus();
  };
  const choose = (i) => {
    close();
    if (i !== selected) onChange(options[i].value, options[i]);
  };

  button.addEventListener("click", () => (list.hidden ? open() : close()));
  button.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (list.hidden) open();
    }
  });
  list.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close(false);
  });
  list.addEventListener("click", (e) => {
    const row = e.target.closest("[data-index]");
    if (row) choose(Number(row.dataset.index));
  });
  list.addEventListener("pointermove", (e) => {
    const row = e.target.closest("[data-index]");
    if (row) setActive(Number(row.dataset.index));
  });
}
