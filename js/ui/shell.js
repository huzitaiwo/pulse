import { NAV_GROUPS } from "../config/navigation.js";
import { icon } from "./icons.js";
import { esc } from "../utils/format.js";

const STORAGE_KEY = "pulse.sidebar";
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

const readPref = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const writePref = (v) => {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* storage unavailable */
  }
};

function navMarkup(session) {
  return NAV_GROUPS.map(
    (group, g) => `
    <div class="nav__group">
      <p class="nav__label" id="nav-group-${g}">${esc(group.label)}</p>
      <ul class="nav__list" role="list" aria-labelledby="nav-group-${g}">
        ${group.items
          .map((item) => {
            const badge = item.badgeKey ? session.badges?.[item.badgeKey] : 0;
            return `<li><a class="nav__link" href="#${item.path}" data-nav="${item.id}" title="${esc(item.label)}">
            ${icon(item.icon)}<span class="nav__text">${esc(item.label)}</span>
            ${badge ? `<span class="nav__badge" aria-label="${badge} open">${badge}</span>` : ""}
          </a></li>`;
          })
          .join("")}
      </ul>
    </div>`,
  ).join("");
}

export function mountShell(root, session) {
  const { user, workspace } = session;
  root.innerHTML = `
    <aside class="sidebar" id="sidebar" aria-label="Sidebar">
      <div class="sidebar__head">
        <a class="brand" href="#/overview" aria-label="Pulse home">
          <img class="brand__mark" src="assets/icons/pulseops.png" alt="" width="28" height="28">
          <span class="brand__name">PULSE</span>
        </a>
        <button class="icon-btn sidebar__collapse" type="button" data-sidebar-toggle aria-label="Collapse sidebar" aria-pressed="false">${icon("collapse")}</button>
        <button class="icon-btn sidebar__close" type="button" data-drawer-close aria-label="Close navigation">${icon("close")}</button>
      </div>

      <button class="workspace-switch" type="button" aria-label="Workspace: ${esc(workspace.name)}. Switch workspace">
        <span class="workspace-switch__mark" aria-hidden="true">${esc(workspace.name[0])}</span>
        <span class="workspace-switch__text"><strong>${esc(workspace.name)}</strong><small>${esc(workspace.plan)}</small></span>
        ${icon("updown", { size: 16 })}
      </button>

      <nav class="nav" aria-label="Primary">${navMarkup(session)}</nav>

      <div class="sidebar__foot">
        <a class="nav__link" href="#/help" title="Help &amp; resources">${icon("help")}<span class="nav__text">Help &amp; resources</span></a>
        <div class="user-card">
          <span class="avatar" aria-hidden="true">${esc(user.initials)}</span>
          <span class="user-card__text"><strong>${esc(user.name)}</strong><small>${esc(user.role)}</small></span>
          <button class="icon-btn" type="button" aria-label="Account menu">${icon("more")}</button>
        </div>
      </div>
    </aside>

    <div class="app__body">
      <header class="topbar">
        <button class="icon-btn topbar__menu" type="button" data-drawer-open aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">${icon("menu", { size: 20 })}</button>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li>${esc(workspace.name)}</li><li aria-current="page" data-crumb>Overview</li></ol>
        </nav>
        <div class="topbar__actions">
          <button class="search-trigger" type="button" data-palette-open aria-label="Search">
            ${icon("search", { size: 16 })}
            <span class="search-trigger__text">Search anything</span>
            <kbd class="kbd" aria-hidden="true">${isMac ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <button class="icon-btn icon-btn--bell" type="button" aria-label="Notifications${session.notifications?.unread ? `, ${session.notifications.unread} unread` : ""}">
            ${icon("bell", { size: 20 })}${session.notifications?.unread ? '<span class="icon-btn__dot"></span>' : ""}
          </button>
          <button class="btn btn--primary" type="button" data-palette-open data-palette-query="Create" aria-label="Create">
            ${icon("plus", { size: 16 })}<span class="btn__label">Create</span>
          </button>
        </div>
      </header>
      <main class="page" id="main" tabindex="-1"></main>
    </div>
    <div class="scrim" data-drawer-close></div>`;

  const sidebarToggle = root.querySelector("[data-sidebar-toggle]");
  const menuButton = root.querySelector("[data-drawer-open]");
  const crumb = root.querySelector("[data-crumb]");
  const desktop = window.matchMedia("(min-width: 901px)");

  const setSidebar = (state) => {
    root.dataset.sidebar = state;
    sidebarToggle.setAttribute("aria-pressed", String(state === "collapsed"));
    sidebarToggle.setAttribute(
      "aria-label",
      state === "collapsed" ? "Expand sidebar" : "Collapse sidebar",
    );
  };
  const setDrawer = (open) => {
    root.dataset.drawer = open ? "open" : "closed";
    menuButton.setAttribute("aria-expanded", String(open));
    if (open) root.querySelector(".sidebar__close").focus();
    else if (!desktop.matches) menuButton.focus({ preventScroll: true });
  };

  setSidebar(readPref() === "collapsed" ? "collapsed" : "expanded");

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-sidebar-toggle]")) {
      const next =
        root.dataset.sidebar === "collapsed" ? "expanded" : "collapsed";
      setSidebar(next);
      writePref(next);
    } else if (e.target.closest("[data-drawer-open]")) setDrawer(true);
    else if (e.target.closest("[data-drawer-close]")) setDrawer(false);
    else if (e.target.closest(".nav__link") && root.dataset.drawer === "open")
      root.dataset.drawer = "closed";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.dataset.drawer === "open") setDrawer(false);
  });
  desktop.addEventListener("change", (e) => {
    if (e.matches) root.dataset.drawer = "closed";
  });

  return {
    outlet: root.querySelector("#main"),
    setActive(nav) {
      root.querySelectorAll("[data-nav]").forEach((link) => {
        if (link.dataset.nav === nav?.id)
          link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      crumb.textContent = nav?.label ?? "Not found";
    },
  };
}
