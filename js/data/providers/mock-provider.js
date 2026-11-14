import { APP_CONFIG } from "../../config/app-config.js";
import { session, overview } from "../mock/overview.js";
import { buildAnalytics } from "../mock/analytics.js";
import { customers } from "../mock/customers.js";
import { projects } from "../mock/projects.js";
import { tasks, DEMO_TODAY } from "../mock/tasks.js";

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

export async function getCustomers() {
  await simulate();
  return structuredClone(customers);
}

let projectStore = structuredClone(projects);

export async function getProjects() {
  await simulate();
  return structuredClone(projectStore);
}

/** Add ?state=move-error to the URL to preview a failed status change. */
export async function updateProjectStatus(id, status) {
  await wait(150);
  if (demoState() === "move-error") throw new Error("Simulated update failure");
  const project = projectStore.find((p) => p.id === id);
  if (project) project.status = status;
}

let taskStore = structuredClone(tasks);

export async function getTasks() {
  await simulate();
  return { today: DEMO_TODAY, tasks: structuredClone(taskStore) };
}

/** Add ?state=move-error to the URL to preview a failed status change. */
export async function updateTaskStatus(id, status) {
  await wait(150);
  if (demoState() === "move-error") throw new Error("Simulated update failure");
  const task = taskStore.find((t) => t.id === id);
  if (task) task.status = status;
}
