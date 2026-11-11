import { repository } from "./data/repository.js";
import { mountShell } from "./ui/shell.js";
import { initPalette } from "./ui/palette.js";
import { startRouter } from "./router.js";
import { toast } from "./ui/toast.js";

async function init() {
  const root = document.getElementById("app");
  let session;
  try {
    session = await repository.getSession();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<main class="page"><div class="card state-panel" role="alert"><h1 class="state-panel__title">We couldn’t start Pulse</h1><p class="state-panel__text">Please refresh the page and try again.</p></div></main>`;
    return;
  }

  const shell = mountShell(root, session);
  initPalette();

  startRouter({
    outlet: shell.outlet,
    session,
    onNavigate({ nav, first }) {
      shell.setActive(nav);
      document.title = `${nav?.label ?? "Page not found"} · Pulse`;
      if (!first) shell.outlet.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    },
  });

  const unread = session.notifications?.unread ?? 0;
  try {
    if (unread && !sessionStorage.getItem("pulse.welcomeToast")) {
      sessionStorage.setItem("pulse.welcomeToast", "1");
      setTimeout(
        () => toast(`You have ${unread} new workspace notifications.`),
        1200,
      );
    }
  } catch {
    /* storage unavailable */
  }
}

init();
