import { useMemo, useState } from "react";
import {
  Bar, Line, ComposedChart,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  BookOpen, Calculator, Clock, DollarSign, GitCompare, LayoutGrid,
  Layers, LineChart as LineChartIcon, PiggyBank, Plus,
  TrendingUp, Users, X, Calendar, Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateQueue } from "@/lib/queueCalculations";
import { optimizeCost, type CostPoint } from "@/lib/costModel";
import { analyzeHourly, PRESET_PROFILES } from "@/lib/hourlyProfile";

/* ─── Shared helpers ────────────────────────────────────────── */
const fmt = (n: number, d = 2) =>
  !isFinite(n) ? "∞" : n.toFixed(d);
const pct = (n: number) => (!isFinite(n) ? "∞" : `${(n * 100).toFixed(1)}%`);

/* ═══════════════════════════════════════════════════════════════
   1) SCENARIO COMPARISON
   ═══════════════════════════════════════════════════════════════ */
interface Scenario {
  id: string;
  name: string;
  lambda: number;
  mu: number;
  c: number;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { id: "s1", name: "Baseline", lambda: 20, mu: 8, c: 3 },
  { id: "s2", name: "+1 Server", lambda: 20, mu: 8, c: 4 },
  { id: "s3", name: "Peak Hour", lambda: 32, mu: 8, c: 4 },
];

function ScenarioComparison() {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);

  const updateScenario = (id: string, field: keyof Scenario, value: string | number) => {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, [field]: typeof value === "string" && field !== "name" ? Number(value) || 0 : value }
          : s,
      ),
    );
  };

  const addScenario = () => {
    if (scenarios.length >= 4) return;
    setScenarios((prev) => [
      ...prev,
      { id: `s${Date.now()}`, name: `Scenario ${prev.length + 1}`, lambda: 20, mu: 8, c: 3 },
    ]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 2) return;
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const results = useMemo(
    () =>
      scenarios.map((s) => {
        const q = calculateQueue({
          arrivalRate: s.lambda,
          serviceRate: s.mu,
          numServers: s.c,
          operatingHours: 1,
        });
        return {
          ...s,
          rho: q.utilization,
          wait: q.avgWaitingTime,
          Lq: q.avgQueueLength,
          pWait: q.probWaiting,
        };
      }),
    [scenarios],
  );

  const chartData = useMemo(
    () =>
      results.map((r) => ({
        name: r.name,
        Wait: isFinite(r.wait) ? parseFloat(r.wait.toFixed(1)) : 0,
        Utilization: parseFloat((r.rho * 100).toFixed(1)),
        Queue: isFinite(r.Lq) ? parseFloat(r.Lq.toFixed(1)) : 0,
      })),
    [results],
  );

  return (
    <div className="space-y-6">
      {/* Scenario editors */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((s) => (
          <div key={s.id} className="bg-dashboard-card rounded-xl border border-dashboard-border p-4 relative">
            {scenarios.length > 2 && (
              <button
                onClick={() => removeScenario(s.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove scenario"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Input
              value={s.name}
              onChange={(e) => updateScenario(s.id, "name", e.target.value)}
              className="font-semibold mb-3 h-8 text-sm"
            />
            <div className="space-y-2 text-xs">
              <div>
                <Label className="text-[10px] text-muted-foreground">Arrival λ (/hr)</Label>
                <Input
                  type="number"
                  min={1}
                  value={s.lambda}
                  onChange={(e) => updateScenario(s.id, "lambda", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Service μ (/hr)</Label>
                <Input
                  type="number"
                  min={1}
                  value={s.mu}
                  onChange={(e) => updateScenario(s.id, "mu", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Servers c</Label>
                <Input
                  type="number"
                  min={1}
                  value={s.c}
                  onChange={(e) => updateScenario(s.id, "c", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
        {scenarios.length < 4 && (
          <button
            onClick={addScenario}
            className="rounded-xl border-2 border-dashed border-dashboard-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[180px]"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Add scenario</span>
          </button>
        )}
      </div>

      {/* Comparison table */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Side-by-Side Metrics</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dashboard-bg">
                <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scenario</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">λ</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">μ</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">c</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ρ</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wait (min)</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lq</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">P(wait)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-dashboard-bg/50 transition-colors">
                  <td className="py-3 px-5 font-medium text-foreground">{r.name}</td>
                  <td className="py-3 px-5 text-right">{r.lambda}</td>
                  <td className="py-3 px-5 text-right">{r.mu}</td>
                  <td className="py-3 px-5 text-right">{r.c}</td>
                  <td className={`py-3 px-5 text-right font-semibold ${r.rho >= 1 ? "text-kpi-red" : r.rho > 0.85 ? "text-kpi-amber" : "text-kpi-green"}`}>{pct(r.rho)}</td>
                  <td className="py-3 px-5 text-right font-semibold">{fmt(r.wait)}</td>
                  <td className="py-3 px-5 text-right font-semibold">{fmt(r.Lq, 1)}</td>
                  <td className="py-3 px-5 text-right font-semibold">{pct(r.pWait)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart comparison */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Waiting Time vs. Utilization</h4>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} label={{ value: "Wait (min)", angle: -90, position: "insideLeft", offset: 15, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} label={{ value: "Utilization %", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(220 15% 91%)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="Wait" fill="hsl(210 80% 45%)" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Utilization" stroke="hsl(38 92% 50%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2) HOURLY SCHEDULE
   ═══════════════════════════════════════════════════════════════ */
function HourlySchedule() {
  const [baseRate, setBaseRate] = useState(20);
  const [mu, setMu] = useState(8);
  const [servers, setServers] = useState(3);
  const [target, setTarget] = useState(0.75);
  const [profileId, setProfileId] = useState("hospital");

  const profile = PRESET_PROFILES.find((p) => p.id === profileId) ?? PRESET_PROFILES[0];

  const result = useMemo(
    () =>
      analyzeHourly({
        baseArrivalRate: baseRate,
        serviceRate: mu,
        servers,
        multipliers: profile.multipliers,
        targetUtilization: target,
      }),
    [baseRate, mu, servers, profile, target],
  );

  const chartData = result.points.map((p) => ({
    hour: p.label,
    Arrivals: p.arrivalRate,
    Wait: Math.min(p.waitMinutes, 120),
    Recommended: p.recommendedServers,
    Current: servers,
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Demand Profile & Capacity</h4>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Arrival pattern</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfileId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  profileId === p.id
                    ? "gradient-bg text-primary-foreground border-transparent shadow-sm"
                    : "bg-dashboard-bg border-dashboard-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{profile.description}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-[10px] text-muted-foreground">Avg λ (cust/hr)</Label>
            <Input type="number" min={1} value={baseRate} onChange={(e) => setBaseRate(Number(e.target.value) || 1)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Service μ (/hr)</Label>
            <Input type="number" min={1} value={mu} onChange={(e) => setMu(Number(e.target.value) || 1)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Fixed staffing c</Label>
            <Input type="number" min={1} value={servers} onChange={(e) => setServers(Number(e.target.value) || 1)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Target utilization (ρ)</Label>
            <Input type="number" min={0.3} max={0.95} step={0.05} value={target} onChange={(e) => setTarget(Number(e.target.value) || 0.75)} className="h-9 text-sm" />
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total daily arrivals", value: `${result.totalArrivals}`, color: "text-kpi-blue", bg: "bg-kpi-blue-bg" },
          { icon: TrendingUp, label: "Peak hour", value: result.peakHour?.label ?? "—", color: "text-kpi-amber", bg: "bg-kpi-amber-bg" },
          { icon: Clock, label: "Avg wait (fixed c)", value: `${result.avgWait} min`, color: "text-kpi-red", bg: "bg-kpi-red-bg" },
          { icon: Sparkles, label: "Max recommended c", value: `${result.maxRecommended}`, color: "text-kpi-green", bg: "bg-kpi-green-bg" },
        ].map((k) => (
          <div key={k.label} className="bg-dashboard-card rounded-xl border border-dashboard-border p-4">
            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </div>
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Hourly arrivals + wait */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h4 className="text-sm font-semibold mb-1">Hourly Arrivals & Waiting Time</h4>
        <p className="text-xs text-muted-foreground mb-3">With fixed {servers} servers across the day</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(220 15% 91%)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="Arrivals" fill="hsl(210 80% 45%)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Wait" stroke="hsl(0 84% 60%)" strokeWidth={2.5} dot={false} name="Wait (min, capped 120)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommended staffing schedule */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h4 className="text-sm font-semibold mb-1">Recommended Staffing Schedule</h4>
        <p className="text-xs text-muted-foreground mb-3">Minimum servers per hour to keep utilization ≤ {(target * 100).toFixed(0)}%</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(220 15% 91%)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Recommended" fill="hsl(160 50% 42%)" radius={[4, 4, 0, 0]} />
              <Line type="step" dataKey="Current" stroke="hsl(215 15% 50%)" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Current staffing" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3) COST OPTIMIZATION
   ═══════════════════════════════════════════════════════════════ */
const CURRENCIES = {
  TRY: { symbol: "₺", code: "TRY", label: "Turkish Lira (₺)", rate: 1 },
  USD: { symbol: "$", code: "USD", label: "US Dollar ($)", rate: 1 / 34 },
  EUR: { symbol: "€", code: "EUR", label: "Euro (€)", rate: 1 / 37 },
} as const;
type CurrencyCode = keyof typeof CURRENCIES;

function CostOptimization() {
  // Defaults reflect Turkish healthcare market hourly rates (₺/hr)
  const [currency, setCurrency] = useState<CurrencyCode>("TRY");
  const [lambda, setLambda] = useState(20);
  const [mu, setMu] = useState(8);
  const [serverCost, setServerCost] = useState(450); // ₺/hr loaded staffing cost per counter
  const [waitCost, setWaitCost] = useState(180);     // ₺/hr opportunity cost per waiting patient

  const cur = CURRENCIES[currency];
  const fmtMoney = (n: number) => {
    const v = n * cur.rate;
    return `${cur.symbol}${v.toLocaleString("tr-TR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  };

  const result = useMemo(
    () =>
      optimizeCost({
        arrivalRate: lambda,
        serviceRate: mu,
        serverCostPerHour: serverCost,
        waitingCostPerHour: waitCost,
      }),
    [lambda, mu, serverCost, waitCost],
  );

  const chartData = result.points.filter((p) => p.feasible).map((p) => ({
    servers: p.servers,
    "Server cost": parseFloat((p.serverCost * cur.rate).toFixed(2)),
    "Waiting cost": parseFloat((p.waitingCost * cur.rate).toFixed(2)),
    "Total cost": parseFloat((p.totalCost * cur.rate).toFixed(2)),
    optimal: p.servers === result.optimalServers ? parseFloat((p.totalCost * cur.rate).toFixed(2)) : null,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Cost Parameters</h4>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Display currency</Label>
            <div className="flex rounded-lg border border-dashboard-border overflow-hidden">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`px-3 py-1 text-xs font-semibold transition-colors ${
                    currency === code
                      ? "bg-primary text-primary-foreground"
                      : "bg-dashboard-card text-muted-foreground hover:bg-dashboard-bg"
                  }`}
                >
                  {CURRENCIES[code].symbol} {code}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-[10px] text-muted-foreground">Arrival λ (/hr)</Label>
            <Input type="number" min={1} value={lambda} onChange={(e) => setLambda(Number(e.target.value) || 1)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Service μ (/hr)</Label>
            <Input type="number" min={1} value={mu} onChange={(e) => setMu(Number(e.target.value) || 1)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Staffing cost (₺/hr per counter)</Label>
            <Input type="number" min={0} value={serverCost} onChange={(e) => setServerCost(Number(e.target.value) || 0)} className="h-9 text-sm" />
            <p className="text-[9px] text-muted-foreground mt-1">Stored in ₺ — display converts.</p>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Waiting cost (₺/patient/hr)</Label>
            <Input type="number" min={0} value={waitCost} onChange={(e) => setWaitCost(Number(e.target.value) || 0)} className="h-9 text-sm" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-4">
          <div className="w-8 h-8 rounded-lg bg-kpi-green-bg flex items-center justify-center mb-2">
            <PiggyBank className="h-4 w-4 text-kpi-green" />
          </div>
          <p className="text-xl font-bold">{result.optimalServers}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Economic optimum (counters)</p>
        </div>
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-4">
          <div className="w-8 h-8 rounded-lg bg-kpi-blue-bg flex items-center justify-center mb-2">
            <DollarSign className="h-4 w-4 text-kpi-blue" />
          </div>
          <p className="text-xl font-bold">{fmtMoney(result.optimalTotalCost)}/hr</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total cost at optimum</p>
        </div>
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-4">
          <div className="w-8 h-8 rounded-lg bg-kpi-amber-bg flex items-center justify-center mb-2">
            <TrendingUp className="h-4 w-4 text-kpi-amber" />
          </div>
          <p className="text-xl font-bold">{fmtMoney(result.savingsVsMin)}/hr</p>
          <p className="text-[10px] text-muted-foreground mt-1">Savings vs. minimum staffing</p>
        </div>
      </div>

      {/* Cost curves */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h4 className="text-sm font-semibold mb-1">Cost vs. Number of Counters</h4>
        <p className="text-xs text-muted-foreground mb-3">Find the point where staffing cost and waiting cost balance.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="servers" tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} label={{ value: "Counters", position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} label={{ value: `${cur.symbol}/hr`, angle: -90, position: "insideLeft", offset: 15, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }} />
              <Tooltip formatter={(v: any) => `${cur.symbol}${Number(v).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`} contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(220 15% 91%)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Server cost" stroke="hsl(160 50% 42%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Waiting cost" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Total cost" stroke="hsl(210 80% 45%)" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="optimal" stroke="hsl(0 84% 60%)" strokeWidth={0} dot={{ r: 7, stroke: "hsl(0 84% 60%)", strokeWidth: 3, fill: "white" }} name="Optimum" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Cost Breakdown ({cur.code})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dashboard-bg">
                <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Counters</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilization</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wait (min)</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staffing {cur.symbol}</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waiting {cur.symbol}</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total {cur.symbol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {result.points.map((p: CostPoint) => {
                const isOptimal = p.servers === result.optimalServers;
                return (
                  <tr key={p.servers} className={`hover:bg-dashboard-bg/50 transition-colors ${isOptimal ? "bg-kpi-green-bg/40" : ""}`}>
                    <td className="py-3 px-5 font-semibold text-foreground">
                      {p.servers}
                      {isOptimal && <span className="ml-2 text-[10px] font-medium text-kpi-green bg-kpi-green/15 px-1.5 py-0.5 rounded">Optimum</span>}
                    </td>
                    <td className="py-3 px-5 text-right">{p.feasible ? `${p.utilization}%` : "∞"}</td>
                    <td className="py-3 px-5 text-right">{p.feasible ? p.waitMinutes : "∞"}</td>
                    <td className="py-3 px-5 text-right">{fmtMoney(p.serverCost)}</td>
                    <td className="py-3 px-5 text-right">{p.feasible ? fmtMoney(p.waitingCost) : "∞"}</td>
                    <td className="py-3 px-5 text-right font-semibold">{p.feasible ? fmtMoney(p.totalCost) : "∞"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4) METHODOLOGY DRAWER
   ═══════════════════════════════════════════════════════════════ */
function MethodologyDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Methodology & Glossary
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Methodology & Glossary
          </SheetTitle>
          <SheetDescription>
            How ServeSmart models queues and what every symbol means.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-sm">
          <section>
            <h4 className="font-semibold text-foreground mb-2">The M/M/c Model</h4>
            <p className="text-muted-foreground leading-relaxed">
              A multi-server queueing model with <em>c</em> identical, parallel servers,
              Poisson arrivals (rate λ), and exponentially distributed service times
              (rate μ per server). Customers wait in a single FIFO queue and are served
              by the first available server.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-2">Symbols</h4>
            <ul className="space-y-2 text-muted-foreground">
              {[
                ["λ (lambda)", "Arrival rate — average customers per hour."],
                ["μ (mu)", "Service rate — average customers served per hour per server."],
                ["c", "Number of parallel servers (tellers, doctors, agents…)."],
                ["ρ = λ / (c·μ)", "Utilization — fraction of time the average server is busy. ρ ≥ 1 ⇒ unstable."],
                ["Wq", "Expected time a customer waits in queue before service."],
                ["Lq", "Expected number of customers waiting in queue."],
                ["W", "Wq + 1/μ — total expected time in the system."],
                ["P(wait)", "Probability an arriving customer finds all servers busy (Erlang-C formula)."],
              ].map(([sym, desc]) => (
                <li key={sym} className="flex gap-3">
                  <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded h-fit whitespace-nowrap text-foreground">{sym}</code>
                  <span className="leading-relaxed">{desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-2">Key formulas</h4>
            <div className="space-y-2 text-muted-foreground">
              <p><code className="font-mono text-xs bg-muted px-2 py-1 rounded">ρ = λ / (c · μ)</code></p>
              <p><code className="font-mono text-xs bg-muted px-2 py-1 rounded">P(wait) = Erlang-C(c, λ/μ)</code></p>
              <p><code className="font-mono text-xs bg-muted px-2 py-1 rounded">Lq = P(wait) · ρ / (1 − ρ)</code></p>
              <p><code className="font-mono text-xs bg-muted px-2 py-1 rounded">Wq = Lq / λ</code> (Little's Law)</p>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-2">Assumptions & limitations</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
              <li>Arrivals are memoryless (Poisson) — fine for independent customers.</li>
              <li>Service times are exponential — a simplifying assumption; reality is often less variable.</li>
              <li>Steady-state analysis — short bursts may exceed predicted waits.</li>
              <li>Servers are identical and never break down.</li>
              <li>Infinite queue capacity, no balking or reneging.</li>
              <li>For non-stationary demand, use the <strong>Hourly Schedule</strong> tab.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-2">Economic optimum</h4>
            <p className="text-muted-foreground leading-relaxed">
              The Cost Optimization tool balances staffing cost (linear in c) against
              waiting cost (convex in c via Lq). The minimum of
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded mx-1">TC(c) = c · Cs + Lq(c) · Cw</code>
              is the economically optimal number of servers.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — Advanced Tools section
   ═══════════════════════════════════════════════════════════════ */
const AdvancedTools = () => {
  return (
    <section id="advanced" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-medical-blue-light text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Layers className="h-4 w-4" />
            Advanced Decision Support
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Beyond a Single Snapshot</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compare scenarios side-by-side, plan staffing across the day, and find the
            economically optimal number of servers — all backed by the M/M/c model.
          </p>
        </div>

        <div className="max-w-7xl mx-auto bg-dashboard-bg rounded-2xl border border-dashboard-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              Choose an analysis
            </h3>
            <MethodologyDrawer />
          </div>

          <Tabs defaultValue="compare" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="compare" className="gap-2 text-xs sm:text-sm">
                <GitCompare className="h-4 w-4" /> Compare Scenarios
              </TabsTrigger>
              <TabsTrigger value="hourly" className="gap-2 text-xs sm:text-sm">
                <Calendar className="h-4 w-4" /> Hourly Schedule
              </TabsTrigger>
              <TabsTrigger value="cost" className="gap-2 text-xs sm:text-sm">
                <DollarSign className="h-4 w-4" /> Cost Optimization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compare" className="mt-0">
              <ScenarioComparison />
            </TabsContent>
            <TabsContent value="hourly" className="mt-0">
              <HourlySchedule />
            </TabsContent>
            <TabsContent value="cost" className="mt-0">
              <CostOptimization />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default AdvancedTools;
