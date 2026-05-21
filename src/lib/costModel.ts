// Economic analysis of M/M/c systems.
// Total cost per hour = c * serverCost + Lq * waitingCost
// Lq is the expected number of customers waiting in queue.
import { calculateQueue } from "./queueCalculations";

export interface CostInput {
  arrivalRate: number;   // λ customers/hour
  serviceRate: number;   // μ customers/hour/server
  serverCostPerHour: number;
  waitingCostPerHour: number; // cost per customer waiting per hour
  minServers?: number;
  maxServers?: number;
}

export interface CostPoint {
  servers: number;
  serverCost: number;
  waitingCost: number;
  totalCost: number;
  utilization: number;
  waitMinutes: number;
  feasible: boolean;
}

export interface CostResult {
  points: CostPoint[];
  optimalServers: number;
  optimalTotalCost: number;
  savingsVsMin: number;
}

export function optimizeCost(input: CostInput): CostResult {
  const { arrivalRate, serviceRate, serverCostPerHour, waitingCostPerHour } = input;
  const minStable = Math.max(1, Math.ceil(arrivalRate / serviceRate));
  const minServers = input.minServers ?? minStable;
  const maxServers = input.maxServers ?? Math.max(minStable + 8, 12);

  const points: CostPoint[] = [];
  for (let c = Math.max(1, minServers); c <= maxServers; c++) {
    const q = calculateQueue({
      arrivalRate,
      serviceRate,
      numServers: c,
      operatingHours: 1,
    });
    const feasible = q.utilization < 1 && isFinite(q.avgQueueLength);
    const Lq = feasible ? q.avgQueueLength : Infinity;
    const serverCost = c * serverCostPerHour;
    const waitingCost = feasible ? Lq * waitingCostPerHour : Infinity;
    const totalCost = feasible ? serverCost + waitingCost : Infinity;
    points.push({
      servers: c,
      serverCost,
      waitingCost: feasible ? parseFloat(waitingCost.toFixed(2)) : 0,
      totalCost: feasible ? parseFloat(totalCost.toFixed(2)) : 0,
      utilization: parseFloat((q.utilization * 100).toFixed(1)),
      waitMinutes: feasible ? parseFloat(q.avgWaitingTime.toFixed(2)) : 0,
      feasible,
    });
  }

  const feasiblePoints = points.filter((p) => p.feasible);
  const optimal = feasiblePoints.reduce(
    (best, p) => (p.totalCost < best.totalCost ? p : best),
    feasiblePoints[0],
  );
  const baseline = feasiblePoints[0];

  return {
    points,
    optimalServers: optimal?.servers ?? minStable,
    optimalTotalCost: optimal?.totalCost ?? 0,
    savingsVsMin: baseline && optimal ? baseline.totalCost - optimal.totalCost : 0,
  };
}
