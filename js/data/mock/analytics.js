/** Demo data for the Analytics page. Replaced by Firestore reads when dataSource === "firebase". */
export const ranges = [
  { value: "may", label: "May 1 – May 31" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "This year" },
];

export const granularities = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "quarterly", label: "Quarterly" },
];

const RANGE_DATA = {
  may: {
    revenue: 84200,
    revenueDelta: 18.2,
    completion: 78.6,
    completionDelta: 5.7,
    onTime: 91.4,
    onTimeDelta: 2.3,
    bars: [64, 73, 61, 90, 81, 100, 86],
  },
  "7d": {
    revenue: 19800,
    revenueDelta: 6.4,
    completion: 74.2,
    completionDelta: 1.9,
    onTime: 89.7,
    onTimeDelta: -0.8,
    bars: [58, 66, 70, 62, 77, 84, 79],
  },
  "30d": {
    revenue: 81300,
    revenueDelta: 14.9,
    completion: 77.1,
    completionDelta: 4.2,
    onTime: 90.6,
    onTimeDelta: 1.7,
    bars: [61, 69, 64, 82, 76, 93, 80],
  },
  "90d": {
    revenue: 236400,
    revenueDelta: 21.3,
    completion: 76.4,
    completionDelta: 3.6,
    onTime: 90.1,
    onTimeDelta: 1.2,
    bars: [60, 67, 63, 79, 74, 88, 78],
  },
  ytd: {
    revenue: 412800,
    revenueDelta: 26.7,
    completion: 75.8,
    completionDelta: 6.1,
    onTime: 89.9,
    onTimeDelta: 2.0,
    bars: [57, 64, 62, 76, 72, 85, 75],
  },
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const SERIES = {
  monthly: [
    ["Jan", 19000],
    ["Feb", 24700],
    ["Mar", 38000],
    ["Apr", 36000],
    ["May", 42000],
    ["Jun", 84200],
  ],
  weekly: [
    ["W1", 9800],
    ["W2", 11200],
    ["W3", 10400],
    ["W4", 13900],
    ["W5", 12600],
    ["W6", 15800],
    ["W7", 17300],
    ["W8", 21200],
  ],
  quarterly: [
    ["Q1", 62000],
    ["Q2", 118000],
    ["Q3", 174000],
    ["Q4", 236400],
  ],
};

const team = [
  {
    name: "Handsome",
    role: "Operations lead",
    tasks: 39,
    onTime: 80,
    utilization: 72,
    tone: "",
  },
  {
    name: "Cryptix",
    role: "Growth strategist",
    tasks: 46,
    onTime: 94,
    utilization: 86,
    tone: "rose",
  },
  {
    name: "Olanma",
    role: "Product designer",
    tasks: 33,
    onTime: 69,
    utilization: 61,
    tone: "teal",
  },
  {
    name: "Warwick",
    role: "Technical PM",
    tasks: 50,
    onTime: 99,
    utilization: 92,
    tone: "amber",
  },
  {
    name: "Ekun",
    role: "Systems analyst",
    tasks: 26,
    onTime: 56,
    utilization: 48,
    tone: "green",
  },
];

const trend = (pct) => ({ dir: pct >= 0 ? "up" : "down", pct: Math.abs(pct) });

export function buildAnalytics({
  range = "may",
  granularity = "monthly",
} = {}) {
  const d = RANGE_DATA[range] ?? RANGE_DATA.may;
  return {
    ranges,
    granularities,
    kpis: [
      {
        id: "revenue",
        label: "Recognized revenue",
        icon: "analytics",
        value: d.revenue / 1000,
        decimals: 1,
        prefix: "$",
        suffix: "k",
        trend: trend(d.revenueDelta),
      },
      {
        id: "completion",
        label: "Project completion",
        icon: "target",
        value: d.completion,
        decimals: 1,
        prefix: "",
        suffix: "%",
        trend: trend(d.completionDelta),
      },
      {
        id: "ontime",
        label: "On-time delivery",
        icon: "clock",
        value: d.onTime,
        decimals: 1,
        prefix: "",
        suffix: "%",
        trend: trend(d.onTimeDelta),
      },
    ],
    revenue: {
      total: d.revenue,
      trend: trend(d.revenueDelta),
      points: SERIES[granularity].map(([label, value]) => ({ label, value })),
    },
    completion: {
      average: d.completion,
      trend: trend(d.completionDelta),
      bars: d.bars.map((value, i) => ({
        label: DAY_LETTERS[i],
        name: DAYS[i],
        value,
        highlight: i >= 5,
      })),
    },
    team,
  };
}
