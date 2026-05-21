// Non-stationary demand: compute M/M/c metrics per hour and recommend staffing.
import { calculateQueue } from "./queueCalculations";

export interface HourlyPoint {
  hour: number;
  label: string;
  arrivalRate: number;
  utilization: number;     // with current c
  waitMinutes: number;     // with current c
  recommendedServers: number; // min servers to keep util <= targetUtil
  recWait: number;            // wait with recommended servers
}

export interface HourlyResult {
  points: HourlyPoint[];
  peakHour: HourlyPoint;
  totalArrivals: number;
  avgWait: number;
  maxRecommended: number;
}

export interface PresetProfile {
  id: string;
  label: string;
  description: string;
  // 24-element array of multipliers applied to a base arrival rate
  multipliers: number[];
}

// Multipliers that sum to ~24 so the average equals 1.0
function normalize(arr: number[]): number[] {
  const sum = arr.reduce((s, v) => s + v, 0);
  const factor = arr.length / sum;
  return arr.map((v) => parseFloat((v * factor).toFixed(3)));
}

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: "flat",
    label: "Flat (steady demand)",
    description: "Uniform arrivals throughout the day",
    multipliers: normalize(Array(24).fill(1)),
  },
  {
    id: "hospital",
    label: "Hospital — morning peak",
    description: "Heavy morning admissions, tapering through the day",
    multipliers: normalize([
      0.1, 0.1, 0.1, 0.1, 0.2, 0.4,
      0.8, 1.4, 2.0, 2.2, 2.0, 1.8,
      1.6, 1.5, 1.4, 1.2, 1.0, 0.9,
      0.7, 0.5, 0.4, 0.3, 0.2, 0.1,
    ]),
  },
  {
    id: "bank",
    label: "Bank — lunch & evening rush",
    description: "Bimodal: lunch hour and after-work peak",
    multipliers: normalize([
      0, 0, 0, 0, 0, 0,
      0, 0, 0.5, 1.2, 1.4, 1.6,
      2.2, 2.0, 1.4, 1.3, 1.6, 2.0,
      1.5, 0.6, 0, 0, 0, 0,
    ]),
  },
  {
    id: "cafeteria",
    label: "Cafeteria — meal peaks",
    description: "Sharp spikes at breakfast, lunch and dinner",
    multipliers: normalize([
      0, 0, 0, 0, 0, 0.2,
      0.8, 1.6, 1.2, 0.4, 0.6, 1.8,
      2.6, 2.0, 0.6, 0.4, 0.6, 1.6,
      2.4, 1.8, 0.6, 0.2, 0.1, 0,
    ]),
  },
  {
    id: "call_center",
    label: "Call center — business hours",
    description: "Concentrated 9–5 demand",
    multipliers: normalize([
      0.1, 0.1, 0.1, 0.1, 0.1, 0.2,
      0.5, 1.0, 1.8, 2.2, 2.4, 2.2,
      1.8, 2.0, 2.2, 2.0, 1.6, 1.0,
      0.5, 0.3, 0.2, 0.2, 0.1, 0.1,
    ]),
  },
];

export interface HourlyInput {
  baseArrivalRate: number; // average λ across the day
  serviceRate: number;     // μ per server per hour
  servers: number;         // current c
  multipliers: number[];   // length 24
  targetUtilization: number; // e.g. 0.75
}

function formatHour(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
}

export function analyzeHourly(input: HourlyInput): HourlyResult {
  const { baseArrivalRate, serviceRate, servers, multipliers, targetUtilization } = input;
  const target = Math.max(0.3, Math.min(0.95, targetUtilization));

  const points: HourlyPoint[] = multipliers.map((m, h) => {
    const lambda = baseArrivalRate * m;
    if (lambda <= 0) {
      return {
        hour: h,
        label: formatHour(h),
        arrivalRate: 0,
        utilization: 0,
        waitMinutes: 0,
        recommendedServers: 0,
        recWait: 0,
      };
    }
    const current = calculateQueue({
      arrivalRate: lambda,
      serviceRate,
      numServers: servers,
      operatingHours: 1,
    });

    // Recommended c = smallest integer keeping util <= target
    let rec = Math.max(1, Math.ceil(lambda / (serviceRate * target)));
    const recCalc = calculateQueue({
      arrivalRate: lambda,
      serviceRate,
      numServers: rec,
      operatingHours: 1,
    });

    return {
      hour: h,
      label: formatHour(h),
      arrivalRate: parseFloat(lambda.toFixed(1)),
      utilization: parseFloat((Math.min(current.utilization, 1.2) * 100).toFixed(1)),
      waitMinutes: isFinite(current.avgWaitingTime)
        ? parseFloat(current.avgWaitingTime.toFixed(1))
        : 999,
      recommendedServers: rec,
      recWait: isFinite(recCalc.avgWaitingTime)
        ? parseFloat(recCalc.avgWaitingTime.toFixed(1))
        : 999,
    };
  });

  const activePoints = points.filter((p) => p.arrivalRate > 0);
  const peakHour = activePoints.reduce(
    (peak, p) => (p.arrivalRate > peak.arrivalRate ? p : peak),
    activePoints[0] ?? points[0],
  );
  const totalArrivals = points.reduce((s, p) => s + p.arrivalRate, 0);
  const avgWait =
    activePoints.length > 0
      ? activePoints.reduce((s, p) => s + Math.min(p.waitMinutes, 240), 0) /
        activePoints.length
      : 0;
  const maxRecommended = points.reduce(
    (m, p) => Math.max(m, p.recommendedServers),
    0,
  );

  return {
    points,
    peakHour,
    totalArrivals: parseFloat(totalArrivals.toFixed(0)),
    avgWait: parseFloat(avgWait.toFixed(1)),
    maxRecommended,
  };
}
