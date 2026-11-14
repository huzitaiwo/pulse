/** Demo tasks. Replaced by Firestore reads when dataSource === "firebase". */
export const DEMO_TODAY = "2026-05-20";

const P = {
  handsome: { name: "Handsome", tone: "" },
  cryptix: { name: "Cryptix", tone: "rose" },
  olanma: { name: "Olanma", tone: "teal" },
  warwick: { name: "Warwick", tone: "amber" },
  ekun: { name: "Ekun", tone: "green" },
};

export const tasks = [
  {
    id: "t-launch-brief",
    title: "Prepare launch readiness brief",
    project: "Q2 go-to-market",
    priority: "high",
    status: "todo",
    due: "2026-05-22",
    assignee: P.cryptix,
  },
  {
    id: "t-component-library",
    title: "Review mobile component library",
    project: "Revamp client portal",
    priority: "low",
    status: "todo",
    due: "2026-05-24",
    assignee: P.olanma,
  },
  {
    id: "t-clinical-onboarding",
    title: "Validate clinical onboarding flow",
    project: "Revamp client portal",
    priority: "high",
    status: "in-progress",
    due: "2026-05-20",
    assignee: P.handsome,
  },
  {
    id: "t-integration-handoffs",
    title: "Map integration handoffs",
    project: "Data migration",
    priority: "medium",
    status: "in-review",
    due: "2026-05-21",
    assignee: P.warwick,
  },
  {
    id: "t-stakeholder-readout",
    title: "Finalize stakeholder readout",
    project: "Service redesign",
    priority: "high",
    status: "in-review",
    due: "2026-05-20",
    assignee: P.ekun,
  },
];
