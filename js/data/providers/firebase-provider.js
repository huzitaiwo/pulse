import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth, db } from "../../firebase/client.js";
import { initials } from "../../utils/format.js";

/*
 * Expected Firestore layout:
 *   users/{uid}                          { name, role, workspaceId }
 *   workspaces/{workspaceId}             { name, plan, badges: { tasks }, notifications: { unread } }
 *   workspaces/{workspaceId}/dashboards/overview   same shape as data/mock/overview.js → overview
 */
const currentUser = () =>
  new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (user) => {
      off();
      resolve(user);
    });
  });

let cache;
async function load() {
  if (cache) return cache;
  const authUser = await currentUser();
  if (!authUser) throw new Error("Not signed in");
  const userSnap = await getDoc(doc(db, "users", authUser.uid));
  const profile = userSnap.data();
  const wsSnap = await getDoc(doc(db, "workspaces", profile.workspaceId));
  cache = {
    profile,
    workspaceId: profile.workspaceId,
    workspace: wsSnap.data(),
  };
  return cache;
}

export async function getSession() {
  const { profile, workspaceId, workspace } = await load();
  return {
    live: true,
    user: {
      id: profile.id ?? "",
      name: profile.name,
      initials: initials(profile.name),
      role: profile.role,
    },
    workspace: { id: workspaceId, name: workspace.name, plan: workspace.plan },
    badges: workspace.badges ?? {},
    notifications: workspace.notifications ?? { unread: 0 },
  };
}

export async function getOverview() {
  const { workspaceId } = await load();
  const snap = await getDoc(
    doc(db, "workspaces", workspaceId, "dashboards", "overview"),
  );
  if (!snap.exists()) throw new Error("Overview data not found");
  return snap.data();
}

/* Expected doc: workspaces/{workspaceId}/analytics/{range}_{granularity}  (same shape as buildAnalytics() in data/mock/analytics.js) */
export async function getAnalytics({
  range = "may",
  granularity = "monthly",
} = {}) {
  const { workspaceId } = await load();
  const snap = await getDoc(
    doc(db, "workspaces", workspaceId, "analytics", `${range}_${granularity}`),
  );
  if (!snap.exists()) throw new Error("Analytics data not found");
  return snap.data();
}

/* Expected collection: workspaces/{workspaceId}/customers/{customerId}  (same shape as data/mock/customers.js) */
export async function getCustomers() {
  const { workspaceId } = await load();
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "customers"),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* Expected collection: workspaces/{workspaceId}/projects/{projectId}  (same shape as data/mock/projects.js) */
export async function getProjects() {
  const { workspaceId } = await load();
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "projects"),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateProjectStatus(id, status) {
  const { workspaceId } = await load();
  await updateDoc(doc(db, "workspaces", workspaceId, "projects", id), {
    status,
  });
}

/* Expected collection: workspaces/{workspaceId}/tasks/{taskId}  (same shape as data/mock/tasks.js) */
export async function getTasks() {
  const { workspaceId } = await load();
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "tasks"),
  );
  return {
    today: new Date().toISOString().slice(0, 10),
    tasks: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}

export async function updateTaskStatus(id, status) {
  const { workspaceId } = await load();
  await updateDoc(doc(db, "workspaces", workspaceId, "tasks", id), { status });
}

/* Expected collection: workspaces/{workspaceId}/events/{eventId}  (same shape as data/mock/calendar.js) */
export async function getCalendar() {
  const { workspaceId } = await load();
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "events"),
  );
  return {
    today: new Date().toISOString().slice(0, 10),
    events: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}
