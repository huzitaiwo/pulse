import { icon } from "./icons.js";
import { esc } from "../utils/format.js";

let uid = 0;

/**
 * mountSelectMenu(host, {
 *   label, buttonLabel, options: [{ value, label }], value,
 *   icon, iconOnly, chevron, collapseLabel, className, onChange
 * })
 */
export function mountSelectMenu(
  host,
  {
    label,
    buttonLabel,
    options,
    value,
    icon: leading,
    iconOnly = false,
    chevron = true,
    collapseLabel = false,
    align = "end",
    className = "",
    onChange,
  },
) {
  const id = `select-menu-${++uid}`;
  let selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  let active = selected;

  host.classList.add("select-menu");
  if (collapseLabel) host.classList.add("select-menu--collapse");
  if (align === "start") host.dataset.align = "start";
  className
    .split(" ")
    .filter(Boolean)
    .forEach((c) => host.classList.add(c));

  host.innerHTML = `
    <button class="select-menu__button${iconOnly ? " select-menu__button--icon" : ""}" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"></button>
    <ul class="select-menu__list" id="${id}" role="listbox" aria-label="${esc(label)}" tabindex="-1" hidden></ul>`;

  const button = host.querySelector("button");
  const list = host.querySelector("ul");

  function paint() {
    const current = options[selected];
    button.setAttribute(
      "aria-label",
      `${buttonLabel ?? label}: ${current.label}`,
    );
    button.innerHTML = iconOnly
      ? icon(leading, { size: 18 })
      : `${leading ? icon(leading, { size: 15 }) : ""}<span class="select-menu__text">${esc(buttonLabel ?? current.label)}</span>${chevron ? icon("chevdown", { size: 15 }) : ""}`;
    list.innerHTML = options
      .map(
        (o, i) => `
      <li class="select-menu__option" role="option" id="${id}-${i}" data-index="${i}" aria-selected="${i === selected}">
        <span>${esc(o.label)}</span>${i === selected ? icon("check", { size: 14 }) : ""}
      </li>`,
      )
      .join("");
  }

  const setActive = (i) => {
    active = (i + options.length) % options.length;
    list
      .querySelectorAll("[role=option]")
      .forEach((el, n) => el.classList.toggle("is-active", n === active));
    list.setAttribute("aria-activedescendant", `${id}-${active}`);
    list
      .querySelector(`#${id}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
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
    if (i === selected) return;
    selected = i;
    paint();
    onChange(options[i].value, options[i]);
  };

  paint();

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
