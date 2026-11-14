import { APP_CONFIG } from "../../config/app-config.js";
import { session, overview } from "../mock/overview.js";
import { buildAnalytics } from "../mock/analytics.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const demoState = () => new URLSearchParams(location.search).get("state");

async function simulate() {
  await wait(demoState() === "slow" ? 2500 : APP_CONFIG.simulatedLatencyMs);
  if (demoState() === "error") throw new Error("Simulated network failure");
}

export async function getSession() {
  return structuredClone(session);
}

/** Add ?state=error to the URL to preview the error state, ?state=slow for a longer skeleton. */
export async function getOverview() {
  await simulate();
  return structuredClone(overview);
}

export async function getAnalytics(options) {
  await simulate();
  return buildAnalytics(options);
}
