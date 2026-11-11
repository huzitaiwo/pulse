import { icon } from "./icons.js";
import { esc } from "../utils/format.js";

/** toast("Saved", { type: "success" | "info" | "error", duration }) */
export function toast(message, { type = "success", duration = 4500 } = {}) {
  const region = document.getElementById("toast-region");
  if (!region) return;

  const el = document.createElement("div");
  el.className = `toast${type === "success" ? "" : ` toast--${type}`}`;
  el.innerHTML = `${icon(type === "error" ? "alert" : "check", { size: 16 })}<span>${esc(message)}</span>`;
  region.append(el);

  const dismiss = () => {
    el.classList.add("is-leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  };
  const timer = setTimeout(dismiss, duration);
  el.addEventListener("click", () => {
    clearTimeout(timer);
    dismiss();
  });
}
