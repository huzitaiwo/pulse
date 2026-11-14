import { esc } from "../utils/format.js";
import { toast } from "./toast.js";

export const syncBanner = ({ label, message }) => `
  <section class="sync-banner" aria-label="${esc(label)}">
    <p class="sync-banner__label">${esc(label)}</p>
    <p class="sync-banner__message">${esc(message)}</p>
    <button class="btn btn--secondary" type="button" data-sign-in>Sign in</button>
  </section>`;

export function bindSyncBanner(root) {
  root.querySelector("[data-sign-in]")?.addEventListener("click", () => {
    toast("Sign-in will be available once the authentication page is built.", {
      type: "info",
    });
  });
}
