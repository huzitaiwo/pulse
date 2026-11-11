import {
  doc,
  getDoc,
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
