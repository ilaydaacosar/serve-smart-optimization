/* ─── Priority Queue Calculation Engine ──────────────────────────
   Simplified preemptive priority queue model for demonstration.
   Uses weighted delay factors to simulate realistic priority effects.
   ─────────────────────────────────────────────────────────────── */

export interface PriorityCategory {
  id: string;
  label: string;
  priorityLevel: number; // 1-5
  enabled: boolean;
  percentage: number;    // % of total arrivals
}

export interface PriorityResult {
  categoryId: string;
  label: string;
  priorityLevel: number;
  arrivalShare: number;
  waitingTime: number;      // minutes
  queueLength: number;
  speedup: string;          // e.g. "2.3x faster"
}

export interface PriorityAnalysis {
  priorityResults: PriorityResult[];
  overallAvgWait: number;
  standardWait: number;
  priorityAvgWait: number;
  fairnessImpact: number;          // % increase in standard wait
  recommendation: string;
  normalWait: number;               // baseline (no priority)
  normalQueueLength: number;
  normalUtilization: number;
  priorityUtilization: number;
  normalRecommendedServers: number;
  priorityRecommendedServers: number;
}

/* Standard queue calc (same formula as main dashboard) */
function calcWait(lambda: number, mu: number, c: number) {
  const rho = lambda / (c * mu);
  if (rho >= 1) return { rho, waitMin: Infinity, Lq: Infinity };
  const W = rho / (mu * (1 - rho));
  return { rho, waitMin: W * 60, Lq: lambda * W };
}

export const DEFAULT_CATEGORIES: PriorityCategory[] = [
  { id: "emergency",  label: "Emergency",  priorityLevel: 5, enabled: true,  percentage: 8  },
  { id: "disabled",   label: "Disabled",   priorityLevel: 4, enabled: true,  percentage: 6  },
  { id: "pregnant",   label: "Pregnant",   priorityLevel: 4, enabled: true,  percentage: 5  },
  { id: "elderly",    label: "Elderly",    priorityLevel: 3, enabled: true,  percentage: 12 },
  { id: "vip",        label: "VIP",        priorityLevel: 2, enabled: false, percentage: 5  },
  { id: "standard",   label: "Standard",   priorityLevel: 1, enabled: true,  percentage: 69 },
];

/** Labels per institution */
export function getCategoryLabels(institution: string): Record<string, string> {
  if (institution === "hospital") {
    return {
      emergency: "Emergency Patient",
      disabled: "Disabled Patient",
      pregnant: "Pregnant Patient",
      elderly: "Elderly Patient",
      vip: "VIP Patient",
      standard: "Standard Patient",
    };
  }
  if (institution === "bank") {
    return {
      emergency: "Urgent Case",
      disabled: "Disabled Customer",
      pregnant: "Pregnant Customer",
      elderly: "Senior Customer",
      vip: "VIP Customer",
      standard: "Standard Customer",
    };
  }
  return {
    emergency: "Emergency",
    disabled: "Disabled",
    pregnant: "Pregnant",
    elderly: "Elderly",
    vip: "VIP / Priority",
    standard: "Standard",
  };
}

/**
 * Simulate priority queue analysis.
 * Uses a simplified preemptive model where higher-priority categories
 * get proportionally lower wait times based on their priority level.
 */
export function analyzePriorityQueue(
  lambda: number,
  mu: number,
  c: number,
  categories: PriorityCategory[],
  institution: string,
): PriorityAnalysis {
  const baseline = calcWait(lambda, mu, c);
  const normalWait = baseline.waitMin;
  const normalLq = baseline.Lq;
  const normalRho = baseline.rho;

  const active = categories.filter((cat) => cat.enabled);
  const totalPct = active.reduce((s, cat) => s + cat.percentage, 0);

  // Normalize percentages
  const normalized = active.map((cat) => ({
    ...cat,
    share: cat.percentage / totalPct,
  }));

  const labels = getCategoryLabels(institution);

  // Max priority level among active
  const maxLevel = Math.max(...active.map((c) => c.priorityLevel));

  // Compute weighted wait times using priority factor
  // Higher priority → lower wait. Factor = 1 - (level-1)/maxLevel * 0.85
  const priorityResults: PriorityResult[] = normalized.map((cat) => {
    const factor = 1 - ((cat.priorityLevel - 1) / maxLevel) * 0.85;
    const wait = normalWait === Infinity ? Infinity : normalWait * factor;
    const lq = normalLq === Infinity ? Infinity : normalLq * cat.share * factor;
    const speedup = normalWait === Infinity || wait === 0
      ? "—"
      : `${(normalWait / wait).toFixed(1)}x faster`;

    return {
      categoryId: cat.id,
      label: labels[cat.id] || cat.label,
      priorityLevel: cat.priorityLevel,
      arrivalShare: cat.share * 100,
      waitingTime: Math.max(0, wait),
      queueLength: Math.max(0, lq),
      speedup: cat.priorityLevel === 1 ? "Baseline" : speedup,
    };
  });

  // Standard & priority averages
  const stdResult = priorityResults.find((r) => r.categoryId === "standard");
  const prioResults = priorityResults.filter((r) => r.categoryId !== "standard");

  const standardWait = stdResult?.waitingTime ?? normalWait;
  const priorityAvgWait = prioResults.length > 0
    ? prioResults.reduce((s, r) => s + r.waitingTime * r.arrivalShare, 0) /
      prioResults.reduce((s, r) => s + r.arrivalShare, 0)
    : 0;

  const overallAvgWait = priorityResults.reduce(
    (s, r) => s + r.waitingTime * (r.arrivalShare / 100),
    0,
  );

  // Fairness impact: how much standard wait increases due to priority
  // In priority mode, standard customers wait longer as others skip ahead
  const standardIncreaseFactor = 1 + prioResults.reduce((s, r) => s + r.arrivalShare / 100 * 0.4, 0);
  const adjustedStandardWait = normalWait === Infinity ? Infinity : standardWait * standardIncreaseFactor;

  // Update standard result with adjusted wait
  if (stdResult) {
    stdResult.waitingTime = adjustedStandardWait === Infinity ? Infinity : adjustedStandardWait;
    stdResult.speedup = "Baseline";
  }

  const fairnessImpact = normalWait === Infinity || normalWait === 0
    ? 0
    : ((adjustedStandardWait - normalWait) / normalWait) * 100;

  // Recommended servers
  let normalRec = c;
  let priorityRec = c;
  for (let s = c; s <= c + 10; s++) {
    const r = calcWait(lambda, mu, s);
    if (r.rho <= 0.75 && normalRec === c) normalRec = s;
    if (r.rho <= 0.7 && priorityRec === c) priorityRec = s;
  }
  // Priority mode may need 1 extra to compensate fairness
  if (fairnessImpact > 15) priorityRec = Math.max(priorityRec, normalRec + 1);

  // Recommendation text
  let recommendation = "";
  if (fairnessImpact > 25) {
    recommendation = `Priority service is significantly increasing standard queue waiting time by ${fairnessImpact.toFixed(0)}%. Consider opening ${priorityRec - c > 0 ? priorityRec - c : 1} additional counter(s) during peak hours to maintain service equity.`;
  } else if (fairnessImpact > 10) {
    recommendation = `Priority ${institution === "hospital" ? "patients are" : "customers are"} receiving faster service, but standard queue waiting time has increased by ${fairnessImpact.toFixed(0)}%. Consider adding one additional counter during peak hours.`;
  } else if (fairnessImpact > 0) {
    recommendation = `Priority service logic is active with minimal impact on standard queue (${fairnessImpact.toFixed(0)}% increase). System is balancing priority access effectively.`;
  } else {
    recommendation = "Priority service is configured but system capacity is sufficient to handle all categories without significant impact on standard service.";
  }

  return {
    priorityResults,
    overallAvgWait,
    standardWait: adjustedStandardWait,
    priorityAvgWait,
    fairnessImpact,
    recommendation,
    normalWait,
    normalQueueLength: normalLq === Infinity ? Infinity : normalLq,
    normalUtilization: normalRho,
    priorityUtilization: normalRho, // utilization doesn't change, just distribution
    normalRecommendedServers: normalRec,
    priorityRecommendedServers: priorityRec,
  };
}
