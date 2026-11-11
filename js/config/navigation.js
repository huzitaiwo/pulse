/** Single source of truth for navigation. Used by the sidebar, command palette and router. */
export const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: "overview",
        path: "/overview",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "analytics",
        path: "/analytics",
      },
      {
        id: "customers",
        label: "Customers",
        icon: "customers",
        path: "/customers",
      },
      {
        id: "projects",
        label: "Projects",
        icon: "projects",
        path: "/projects",
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: "tasks",
        path: "/tasks",
        badgeKey: "tasks",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: "calendar",
        path: "/calendar",
      },
      { id: "team", label: "Team", icon: "team", path: "/team" },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "reports", label: "Reports", icon: "reports", path: "/reports" },
      {
        id: "activity",
        label: "Activity",
        icon: "activity",
        path: "/activity",
      },
      { id: "billing", label: "Billing", icon: "billing", path: "/billing" },
      {
        id: "documents",
        label: "Documents",
        icon: "documents",
        path: "/documents",
      },
      {
        id: "settings",
        label: "Settings",
        icon: "settings",
        path: "/settings",
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const QUICK_ACTIONS = [
  {
    id: "create-project",
    label: "Create project",
    desc: "Start a new project",
    path: null,
  },
  {
    id: "create-task",
    label: "Create task",
    desc: "Add a task to a project",
    path: null,
  },
  {
    id: "add-customer",
    label: "Add customer",
    desc: "Add a company to your CRM",
    path: null,
  },
  {
    id: "invite-teammate",
    label: "Invite teammate",
    desc: "Send a workspace invitation",
    path: null,
  },
];
