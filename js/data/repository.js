import { APP_CONFIG } from "../config/app-config.js";
import * as mock from "./providers/mock-provider.js";

let providerPromise;
function provider() {
  providerPromise ??=
    APP_CONFIG.dataSource === "firebase"
      ? import("./providers/firebase-provider.js")
      : Promise.resolve(mock);
  return providerPromise;
}

/** The UI only ever talks to this object, never to a provider or to Firebase directly. */
export const repository = {
  getSession: async () => (await provider()).getSession(),
  getOverview: async () => (await provider()).getOverview(),
  getAnalytics: async (options) => (await provider()).getAnalytics(options),
  getCustomers: async () => (await provider()).getCustomers(),
  getProjects: async () => (await provider()).getProjects(),
  updateProjectStatus: async (id, status) =>
    (await provider()).updateProjectStatus(id, status),
  getTasks: async () => (await provider()).getTasks(),
  updateTaskStatus: async (id, status) =>
    (await provider()).updateTaskStatus(id, status),
  getCalendar: async () => (await provider()).getCalendar(),
  getTeam: async () => (await provider()).getTeam(),
  updateMemberStatus: async (id, status) =>
    (await provider()).updateMemberStatus(id, status),
  getReports: async () => (await provider()).getReports(),
};
