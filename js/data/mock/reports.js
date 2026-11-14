/** Demo saved reports. Replaced by Firestore reads when dataSource === "firebase". */
export const reports = [
  {
    id: "project-health-review",
    title: "Project health review",
    description: "Portfolio health, risk, and milestone variance",
    icon: "target",
    tone: "",
    href: "#/projects",
  },
  {
    id: "revenue-realization",
    title: "Revenue realization",
    description: "Monthly revenue, invoice status, and forecast",
    icon: "analytics",
    tone: "green",
    href: "#/analytics",
  },
  {
    id: "capacity-forecast",
    title: "Capacity forecast",
    description: "Utilization, delivery capacity, and workload",
    icon: "team",
    tone: "teal",
    href: "#/team",
  },
  {
    id: "customer-relationship-pulse",
    title: "Customer relationship pulse",
    description: "Account health, activity, and opportunities",
    icon: "customers",
    tone: "rose",
    href: "#/customers",
  },
];
