export interface QueueInput {
  arrivalRate: number; // λ (patients/hour)
  serviceRate: number; // μ (patients/hour/doctor)
  numServers: number;  // c
  operatingHours: number;
}

export interface QueueResult {
  utilization: number;        // ρ
  avgWaitingTime: number;     // Wq (minutes)
  avgQueueLength: number;     // Lq
  systemUtilization: number;  // ρ/c
  probWaiting: number;        // probability of waiting
  recommendedDoctors: number;
  recommendation: string;
  avgSystemTime: number;      // W (minutes)
  avgPatientsInSystem: number; // L
  totalPatientsPerDay: number;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function erlangC(c: number, rho: number): number {
  const a = rho * c; // traffic intensity
  if (rho >= 1) return 1;
  
  let sum = 0;
  for (let k = 0; k < c; k++) {
    sum += Math.pow(a, k) / factorial(k);
  }
  
  const lastTerm = Math.pow(a, c) / (factorial(c) * (1 - rho));
  const p0 = 1 / (sum + lastTerm);
  
  return (lastTerm * p0);
}

export function calculateQueue(input: QueueInput): QueueResult {
  const { arrivalRate, serviceRate, numServers, operatingHours } = input;
  
  const rho = arrivalRate / (numServers * serviceRate); // server utilization
  const totalPatientsPerDay = arrivalRate * operatingHours;
  
  if (rho >= 1) {
    // System is unstable
    const rec = Math.ceil(arrivalRate / serviceRate) + 1;
    return {
      utilization: rho,
      avgWaitingTime: Infinity,
      avgQueueLength: Infinity,
      systemUtilization: rho,
      probWaiting: 1,
      recommendedDoctors: rec,
      recommendation: `The system is overloaded (utilization ${(rho * 100).toFixed(0)}%). You need at least ${rec} doctors to handle the current patient load. Immediate action is required to prevent excessive wait times.`,
      avgSystemTime: Infinity,
      avgPatientsInSystem: Infinity,
      totalPatientsPerDay,
    };
  }
  
  // M/M/c calculations
  const pW = erlangC(numServers, rho);
  const Lq = pW * rho / (1 - rho);
  const Wq = Lq / arrivalRate * 60; // convert to minutes
  const W = Wq + (1 / serviceRate) * 60;
  const L = arrivalRate * (W / 60);
  
  // Find recommended doctors
  let recommended = numServers;
  if (rho > 0.75) {
    for (let c = numServers + 1; c <= numServers + 10; c++) {
      const newRho = arrivalRate / (c * serviceRate);
      if (newRho <= 0.7) {
        recommended = c;
        break;
      }
    }
  }
  
  // Generate recommendation
  let recommendation = "";
  if (rho > 0.85) {
    const reduction = ((Wq - (Wq * 0.65)) / Wq * 100).toFixed(0);
    recommendation = `Current system utilization is high (${(rho * 100).toFixed(0)}%). Increasing the number of doctors from ${numServers} to ${recommended} may reduce waiting time by approximately ${reduction}%. Immediate optimization is recommended.`;
  } else if (rho > 0.7) {
    recommendation = `System utilization is moderate at ${(rho * 100).toFixed(0)}%. Consider adding ${recommended - numServers} more doctor(s) during peak hours to maintain service quality and reduce average wait times.`;
  } else if (rho > 0.5) {
    recommendation = `System is performing well with ${(rho * 100).toFixed(0)}% utilization. Current staffing levels are adequate. Monitor arrival patterns for potential peak-hour adjustments.`;
  } else {
    recommendation = `System utilization is low at ${(rho * 100).toFixed(0)}%. Current capacity exceeds demand. Consider optimizing resource allocation or redistributing staff to busier departments.`;
  }
  
  return {
    utilization: rho,
    avgWaitingTime: Math.max(0, Wq),
    avgQueueLength: Math.max(0, Lq),
    systemUtilization: rho,
    probWaiting: Math.max(0, Math.min(1, pW)),
    recommendedDoctors: Math.max(recommended, numServers),
    recommendation,
    avgSystemTime: Math.max(0, W),
    avgPatientsInSystem: Math.max(0, L),
    totalPatientsPerDay,
  };
}

export function generateCapacityData(input: QueueInput) {
  const data = [];
  const maxDoctors = Math.max(input.numServers + 5, 10);
  const minDoctors = Math.max(1, Math.ceil(input.arrivalRate / input.serviceRate));
  
  for (let c = minDoctors; c <= maxDoctors; c++) {
    const result = calculateQueue({ ...input, numServers: c });
    data.push({
      doctors: c,
      waitingTime: result.avgWaitingTime === Infinity ? null : parseFloat(result.avgWaitingTime.toFixed(1)),
      utilization: parseFloat((result.systemUtilization * 100).toFixed(1)),
      queueLength: result.avgQueueLength === Infinity ? null : parseFloat(result.avgQueueLength.toFixed(1)),
    });
  }
  return data;
}
