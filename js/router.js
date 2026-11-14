import { NAV_ITEMS } from "./config/navigation.js";

/** Hash router. Pages are lazy-loaded modules exporting render(outlet, ctx) → optional cleanup fn. */
const ROUTES = {
  "/overview": () => import("./pages/overview.js"),
  "/analytics": () => import("./pages/analytics.js"),
  "/customers": () => import("./pages/customers.js"),
  "/projects": () => import("./pages/projects.js"),
  "/tasks": () => import("./pages/tasks.js"),
  "/calendar": () => import("./pages/calendar.js"),
  "/team": () => import("./pages/team.js"),
};

export function startRouter({ outlet, session, onNavigate }) {
  let cleanup = null;
  let token = 0;
  let first = true;

  async function resolve() {
    const path = (location.hash.slice(1) || "/overview").split("?")[0];
    const nav = NAV_ITEMS.find((item) => item.path === path) ?? null;
    const loader =
      ROUTES[path] ??
      (nav
        ? () => import("./pages/coming-next.js")
        : () => import("./pages/not-found.js"));

    const current = ++token;
    const mod = await loader();
    if (current !== token) return;

    cleanup?.();
    outlet.replaceChildren();
    cleanup = mod.render(outlet, { session, nav, path }) ?? null;

    onNavigate({ nav, first });
    first = false;
  }

  if (!location.hash)
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#/overview`,
    );
  window.addEventListener("hashchange", resolve);
  resolve();
}
