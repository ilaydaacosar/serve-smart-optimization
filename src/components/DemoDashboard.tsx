import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell, PieChart, Pie, BarChart, Bar,
} from "recharts";
import {
  Activity, AlertCircle, ArrowDown, ArrowUp, Building2, CheckCircle2,
  Clock, Gauge, Info, LayoutDashboard, Minus, Settings2,
  TrendingUp, Users, Zap, BarChart3, Table2, Lightbulb,
  ShieldCheck, ToggleLeft, ToggleRight, Crown, Heart, Accessibility,
  UserCheck, Star, AlertTriangle,
} from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  analyzePriorityQueue,
  getCategoryLabels,
  type PriorityCategory,
  type PriorityAnalysis,
} from "@/lib/priorityQueueCalculations";

/* ─── Institution config ────────────────────────────────────── */
const institutionTypes = [
  { value: "hospital", label: "Hospital", icon: "🏥" },
  { value: "bank", label: "Bank", icon: "🏦" },
  { value: "cafeteria", label: "Cafeteria", icon: "🍽️" },
  { value: "government", label: "Government Office", icon: "🏛️" },
  { value: "university", label: "University Office", icon: "🎓" },
  { value: "call_center", label: "Call Center", icon: "📞" },
  { value: "customer_service", label: "Customer Service", icon: "🤝" },
];

const institutionLabels: Record<string, { server: string; customer: string }> = {
  hospital: { server: "doctors", customer: "patients" },
  bank: { server: "tellers", customer: "customers" },
  cafeteria: { server: "counters", customer: "customers" },
  government: { server: "service windows", customer: "citizens" },
  university: { server: "staff members", customer: "students" },
  call_center: { server: "agents", customer: "callers" },
  customer_service: { server: "representatives", customer: "customers" },
};

const priorityIcons: Record<string, React.ElementType> = {
  emergency: AlertTriangle,
  disabled: Accessibility,
  pregnant: Heart,
  elderly: UserCheck,
  vip: Crown,
  standard: Users,
};

const priorityColors: Record<number, { text: string; bg: string; badge: string }> = {
  5: { text: "text-kpi-red", bg: "bg-kpi-red-bg", badge: "bg-kpi-red/15 text-kpi-red" },
  4: { text: "text-kpi-amber", bg: "bg-kpi-amber-bg", badge: "bg-kpi-amber/15 text-kpi-amber" },
  3: { text: "text-kpi-blue", bg: "bg-kpi-blue-bg", badge: "bg-kpi-blue/15 text-kpi-blue" },
  2: { text: "text-primary", bg: "bg-primary/10", badge: "bg-primary/15 text-primary" },
  1: { text: "text-muted-foreground", bg: "bg-muted", badge: "bg-muted text-muted-foreground" },
};

/* ─── Calculation (standard) ────────────────────────────────── */
interface CalcResult {
  rho: number;
  waitMinutes: number;
  Lq: number;
  pWait: number;
}

function calcQueue(lambda: number, mu: number, c: number): CalcResult {
  const rho = lambda / (c * mu);
  if (rho >= 1) return { rho, waitMinutes: Infinity, Lq: Infinity, pWait: 1 };
  const W = rho / (mu * (1 - rho));
  const waitMinutes = W * 60;
  const Lq = lambda * W;
  const pWait = Math.pow(rho, c);
  return { rho, waitMinutes: Math.max(0, waitMinutes), Lq: Math.max(0, Lq), pWait: Math.min(1, Math.max(0, pWait)) };
}

function getRecommendation(rho: number) {
  if (rho > 0.9) return { text: "Critical overload. Increase servers immediately to prevent service collapse.", severity: "critical" as const };
  if (rho >= 0.75) return { text: "High load. Consider increasing capacity to maintain acceptable service levels.", severity: "high" as const };
  if (rho < 0.5) return { text: "System is underutilized. Consider reducing servers to optimize resource allocation.", severity: "low" as const };
  return { text: "System operating efficiently. Current capacity matches demand well.", severity: "optimal" as const };
}

/* ─── Helpers ───────────────────────────────────────────────── */
const fmt = (n: number, d = 2) => (n === Infinity ? "∞" : n.toFixed(d));
const pct = (n: number) => (n === Infinity ? "∞" : `${(n * 100).toFixed(1)}%`);

function getUtilColor(rho: number) {
  if (rho > 0.85) return { text: "text-kpi-red", bg: "bg-kpi-red-bg", ring: "ring-kpi-red/20", label: "Critical" };
  if (rho >= 0.6) return { text: "text-kpi-amber", bg: "bg-kpi-amber-bg", ring: "ring-kpi-amber/20", label: "Moderate" };
  return { text: "text-kpi-green", bg: "bg-kpi-green-bg", ring: "ring-kpi-green/20", label: "Healthy" };
}

/* ─── Custom Tooltip ────────────────────────────────────────── */
const ChartTooltipCustom = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dashboard-card border border-dashboard-border rounded-lg px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1.5">{label} servers</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-medium text-foreground">{p.value !== null ? p.value : "N/A"} min</span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const DemoDashboard = () => {
  const [lambda, setLambda] = useState(20);
  const [mu, setMu] = useState(8);
  const [c, setC] = useState(3);
  const [hours, setHours] = useState(8);
  const [institution, setInstitution] = useState("hospital");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Priority state
  const [priorityEnabled, setPriorityEnabled] = useState(false);
  const [categories, setCategories] = useState<PriorityCategory[]>(DEFAULT_CATEGORIES);
  const [priorityAnalysis, setPriorityAnalysis] = useState<PriorityAnalysis | null>(null);

  const labels = institutionLabels[institution];
  const catLabels = getCategoryLabels(institution);

  const handleAnalyze = () => {
    const r = calcQueue(lambda, mu, c);
    setResult(r);
    if (priorityEnabled) {
      setPriorityAnalysis(analyzePriorityQueue(lambda, mu, c, categories, institution));
    } else {
      setPriorityAnalysis(null);
    }
    setHasAnalyzed(true);
  };

  const toggleCategory = (id: string) => {
    if (id === "standard") return; // standard always on
    setCategories((prev) =>
      prev.map((cat) => cat.id === id ? { ...cat, enabled: !cat.enabled } : cat),
    );
  };

  const updateCategoryPct = (id: string, pct: number) => {
    setCategories((prev) =>
      prev.map((cat) => cat.id === id ? { ...cat, percentage: Math.max(0, Math.min(100, pct)) } : cat),
    );
  };

  /* what-if table */
  const whatIfData = useMemo(() => {
    if (!hasAnalyzed) return [];
    return [c, c + 1, c + 2].map((servers) => ({ servers, ...calcQueue(lambda, mu, servers) }));
  }, [hasAnalyzed, lambda, mu, c]);

  /* chart data */
  const chartData = useMemo(() => {
    if (!hasAnalyzed) return [];
    const minC = Math.max(1, Math.ceil(lambda / mu));
    const maxC = Math.max(c + 5, 10);
    const data = [];
    for (let s = minC; s <= maxC; s++) {
      const r = calcQueue(lambda, mu, s);
      data.push({ servers: s, waitingTime: r.waitMinutes === Infinity ? null : parseFloat(r.waitMinutes.toFixed(1)) });
    }
    return data;
  }, [hasAnalyzed, lambda, mu, c]);

  /* gauge */
  const gaugeData = useMemo(() => {
    if (!result) return [];
    return [{ name: "Utilization", value: parseFloat((Math.min(result.rho, 1) * 100).toFixed(1)), fill: "url(#gaugeGrad)" }];
  }, [result]);

  /* pie */
  const pieData = useMemo(() => {
    if (!result || result.waitMinutes === Infinity) return [];
    const serviceMin = (1 / mu) * 60;
    return [
      { name: "Waiting", value: parseFloat(result.waitMinutes.toFixed(1)), fill: "hsl(var(--kpi-amber))" },
      { name: "Service", value: parseFloat(serviceMin.toFixed(1)), fill: "hsl(var(--kpi-blue))" },
    ];
  }, [result, mu]);

  const rec = result ? getRecommendation(result.rho) : null;

  return (
    <section id="demo" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-medical-blue-light text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <LayoutDashboard className="h-4 w-4" />
            Interactive Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Queue Optimization Dashboard</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Configure your service environment, run the analysis, and explore professional-grade queue metrics with priority service logic.
          </p>
        </div>

        {/* ─── Dashboard Shell ─── */}
        <div className="max-w-7xl mx-auto bg-dashboard-bg rounded-2xl border border-dashboard-border overflow-hidden">

          {/* Dashboard Top Bar */}
          <div className="bg-dashboard-card border-b border-dashboard-border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">ServeSmart Analytics</h3>
                <p className="text-xs text-muted-foreground">Queue Theory Engine · ρ = λ / (c × μ)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {priorityEnabled && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ShieldCheck className="h-3 w-3" />
                  Priority Mode
                </span>
              )}
              {hasAnalyzed && result && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ring-1 ${getUtilColor(result.rho).bg} ${getUtilColor(result.rho).text} ${getUtilColor(result.rho).ring}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {getUtilColor(result.rho).label}
                </span>
              )}
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">v3.0</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">

            {/* ─── Configuration Panel ─── */}
            <div className="grid lg:grid-cols-[1fr_auto] gap-4">
              <div className="space-y-4">
                {/* Institution Row */}
                <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Institution Type</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {institutionTypes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setInstitution(t.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          institution === t.value
                            ? "gradient-bg text-primary-foreground border-transparent shadow-sm"
                            : "bg-dashboard-card border-dashboard-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        <span className="mr-1">{t.icon}</span>{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parameters Grid */}
                <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Parameters</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Arrival Rate (λ)", sub: `${labels.customer}/hr`, value: lambda, set: setLambda, icon: Users },
                      { label: "Service Rate (μ)", sub: `per ${labels.server.replace(/s$/, "")}/hr`, value: mu, set: setMu, icon: Zap },
                      { label: `${labels.server.charAt(0).toUpperCase() + labels.server.slice(1)} (c)`, sub: "servers", value: c, set: setC, icon: Gauge },
                      { label: "Operating Hours", sub: "hours/day", value: hours, set: setHours, icon: Clock },
                    ].map((field) => (
                      <div key={field.label} className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <field.icon className="h-3.5 w-3.5" />
                          {field.label}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(e) => field.set(Number(e.target.value) || 1)}
                          className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                        />
                        <span className="text-[10px] text-muted-foreground">{field.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analyze Button Panel */}
              <div className="lg:w-48 flex lg:flex-col items-center justify-center gap-3 bg-dashboard-card rounded-xl border border-dashboard-border p-4">
                <button
                  onClick={handleAnalyze}
                  className="w-full gradient-bg text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
                >
                  <Zap className="h-4 w-4" /> Analyze Queue
                </button>
                <p className="text-[10px] text-center text-muted-foreground leading-tight">
                  Calculate ρ, Wq, Lq, P(wait) with {priorityEnabled ? "priority" : "standard"} mode
                </p>
              </div>
            </div>

            {/* ─── Priority Queue Settings ─── */}
            <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden">
              <div className="px-5 py-4 border-b border-dashboard-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Priority Queue Settings</h4>
                    <p className="text-xs text-muted-foreground">Configure priority-based service handling</p>
                  </div>
                </div>
                <button
                  onClick={() => setPriorityEnabled(!priorityEnabled)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                    priorityEnabled
                      ? "gradient-bg text-primary-foreground border-transparent shadow-sm"
                      : "bg-dashboard-bg border-dashboard-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {priorityEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {priorityEnabled ? "Priority Enabled" : "Normal Queue"}
                </button>
              </div>

              {priorityEnabled && (
                <div className="p-5 space-y-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/10 rounded-lg px-4 py-2.5 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                    Priority service logic is used to improve accessibility and urgent care responsiveness while monitoring the impact on total queue performance.
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((cat) => {
                      const Icon = priorityIcons[cat.id] || Users;
                      const color = priorityColors[cat.priorityLevel] || priorityColors[1];
                      const catLabel = catLabels[cat.id] || cat.label;
                      return (
                        <div
                          key={cat.id}
                          className={`rounded-xl border p-4 transition-all ${
                            cat.enabled
                              ? "border-primary/20 bg-primary/[0.02] shadow-sm"
                              : "border-dashboard-border bg-dashboard-bg opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg ${color.bg} flex items-center justify-center`}>
                                <Icon className={`h-3.5 w-3.5 ${color.text}`} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{catLabel}</p>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color.badge}`}>
                                  Level {cat.priorityLevel}
                                </span>
                              </div>
                            </div>
                            {cat.id !== "standard" && (
                              <button
                                onClick={() => toggleCategory(cat.id)}
                                className={`w-8 h-5 rounded-full transition-all flex items-center ${
                                  cat.enabled ? "bg-primary justify-end" : "bg-muted justify-start"
                                }`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm mx-0.5" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">% of total arrivals</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cat.percentage}
                              onChange={(e) => updateCategoryPct(cat.id, Number(e.target.value))}
                              disabled={!cat.enabled}
                              className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors disabled:opacity-40"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Results ─── */}
            {hasAnalyzed && result && rec && (
              <div className="space-y-6 animate-fade-in">

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {(() => {
                    const kpis = [
                      {
                        icon: Gauge, label: "Utilization (ρ)",
                        value: pct(result.rho), unit: "",
                        color: getUtilColor(result.rho).text, bg: getUtilColor(result.rho).bg,
                        trend: result.rho > 0.85 ? "up" as const : result.rho >= 0.6 ? "neutral" as const : "down" as const,
                      },
                      {
                        icon: Clock, label: priorityEnabled && priorityAnalysis ? "Priority Wait Time" : "Avg. Waiting Time",
                        value: priorityEnabled && priorityAnalysis
                          ? `${fmt(priorityAnalysis.priorityAvgWait)}`
                          : `${fmt(result.waitMinutes)}`,
                        unit: "min",
                        color: "text-kpi-blue", bg: "bg-kpi-blue-bg",
                        trend: (priorityEnabled && priorityAnalysis ? priorityAnalysis.priorityAvgWait : result.waitMinutes) > 15 ? "up" as const : "down" as const,
                      },
                      {
                        icon: Users, label: priorityEnabled && priorityAnalysis ? "Standard Wait Time" : "Queue Length (Lq)",
                        value: priorityEnabled && priorityAnalysis
                          ? `${fmt(priorityAnalysis.standardWait)}`
                          : `${fmt(result.Lq, 1)}`,
                        unit: priorityEnabled ? "min" : labels.customer,
                        color: "text-kpi-amber", bg: "bg-kpi-amber-bg",
                        trend: (priorityEnabled && priorityAnalysis
                          ? priorityAnalysis.standardWait > result.waitMinutes
                          : result.Lq > 5) ? "up" as const : "down" as const,
                      },
                      {
                        icon: priorityEnabled ? ShieldCheck : Activity,
                        label: priorityEnabled && priorityAnalysis ? "Queue Fairness Impact" : "Prob. of Waiting",
                        value: priorityEnabled && priorityAnalysis
                          ? `+${priorityAnalysis.fairnessImpact.toFixed(0)}%`
                          : pct(result.pWait),
                        unit: priorityEnabled ? "std. wait ↑" : "",
                        color: priorityEnabled && priorityAnalysis && priorityAnalysis.fairnessImpact > 20
                          ? "text-kpi-red" : "text-kpi-amber",
                        bg: priorityEnabled && priorityAnalysis && priorityAnalysis.fairnessImpact > 20
                          ? "bg-kpi-red-bg" : "bg-kpi-amber-bg",
                        trend: (priorityEnabled && priorityAnalysis
                          ? priorityAnalysis.fairnessImpact > 15
                          : result.pWait > 0.5) ? "up" as const : "down" as const,
                      },
                    ];
                    return kpis.map((kpi) => (
                      <div key={kpi.label} className="bg-dashboard-card rounded-xl border border-dashboard-border p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                          </div>
                          <div className={`flex items-center gap-0.5 text-xs font-medium ${
                            kpi.trend === "up" ? "text-kpi-red" : kpi.trend === "down" ? "text-kpi-green" : "text-kpi-amber"
                          }`}>
                            {kpi.trend === "up" ? <ArrowUp className="h-3 w-3" /> : kpi.trend === "down" ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {kpi.trend === "up" ? "High" : kpi.trend === "down" ? "Low" : "OK"}
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground leading-none">{kpi.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {kpi.unit && <span className="font-medium">{kpi.unit} · </span>}{kpi.label}
                        </p>
                      </div>
                    ));
                  })()}
                </div>

                {/* Priority Results Table */}
                {priorityEnabled && priorityAnalysis && (
                  <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden animate-fade-in">
                    <div className="px-5 py-4 border-b border-dashboard-border flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Priority Queue Breakdown</h4>
                        <p className="text-xs text-muted-foreground">Estimated wait times by {labels.customer} category</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-dashboard-bg">
                            <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                            <th className="text-center py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                            <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrival %</th>
                            <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wait Time</th>
                            <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Queue Length</th>
                            <th className="text-center py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Speed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dashboard-border">
                          {priorityAnalysis.priorityResults.map((pr) => {
                            const Icon = priorityIcons[pr.categoryId] || Users;
                            const color = priorityColors[pr.priorityLevel] || priorityColors[1];
                            return (
                              <tr key={pr.categoryId} className="hover:bg-dashboard-bg/50 transition-colors">
                                <td className="py-3 px-5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-md ${color.bg} flex items-center justify-center`}>
                                      <Icon className={`h-3 w-3 ${color.text}`} />
                                    </div>
                                    <span className="font-medium text-foreground text-xs">{pr.label}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-5 text-center">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color.badge}`}>
                                    Level {pr.priorityLevel}
                                  </span>
                                </td>
                                <td className="py-3 px-5 text-right font-semibold text-foreground text-xs">{pr.arrivalShare.toFixed(0)}%</td>
                                <td className="py-3 px-5 text-right font-semibold text-foreground text-xs">{fmt(pr.waitingTime)} min</td>
                                <td className="py-3 px-5 text-right font-semibold text-foreground text-xs">{fmt(pr.queueLength, 1)}</td>
                                <td className="py-3 px-5 text-center">
                                  <span className={`text-[10px] font-medium ${pr.categoryId === "standard" ? "text-muted-foreground" : "text-kpi-green"}`}>
                                    {pr.speedup}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Priority Comparison Table */}
                {priorityEnabled && priorityAnalysis && (
                  <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden animate-fade-in">
                    <div className="px-5 py-4 border-b border-dashboard-border flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Scenario Comparison</h4>
                        <p className="text-xs text-muted-foreground">Normal queue vs. priority queue enabled</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-dashboard-bg">
                            <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metric</th>
                            <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Without Priority</th>
                            <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">With Priority</th>
                            <th className="text-center py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dashboard-border">
                          {[
                            {
                              metric: "Avg. Waiting Time",
                              normal: `${fmt(priorityAnalysis.normalWait)} min`,
                              priority: `${fmt(priorityAnalysis.overallAvgWait)} min`,
                              change: priorityAnalysis.normalWait === Infinity ? "—"
                                : `${((priorityAnalysis.overallAvgWait - priorityAnalysis.normalWait) / priorityAnalysis.normalWait * 100).toFixed(0)}%`,
                              isWorse: priorityAnalysis.overallAvgWait > priorityAnalysis.normalWait,
                            },
                            {
                              metric: "Queue Length",
                              normal: `${fmt(priorityAnalysis.normalQueueLength, 1)}`,
                              priority: `${fmt(result.Lq, 1)}`,
                              change: "~0%",
                              isWorse: false,
                            },
                            {
                              metric: "Utilization",
                              normal: pct(priorityAnalysis.normalUtilization),
                              priority: pct(priorityAnalysis.priorityUtilization),
                              change: "No change",
                              isWorse: false,
                            },
                            {
                              metric: "Recommended Servers",
                              normal: `${priorityAnalysis.normalRecommendedServers}`,
                              priority: `${priorityAnalysis.priorityRecommendedServers}`,
                              change: priorityAnalysis.priorityRecommendedServers > priorityAnalysis.normalRecommendedServers
                                ? `+${priorityAnalysis.priorityRecommendedServers - priorityAnalysis.normalRecommendedServers}`
                                : "Same",
                              isWorse: priorityAnalysis.priorityRecommendedServers > priorityAnalysis.normalRecommendedServers,
                            },
                          ].map((row) => (
                            <tr key={row.metric} className="hover:bg-dashboard-bg/50 transition-colors">
                              <td className="py-3 px-5 font-medium text-foreground text-xs">{row.metric}</td>
                              <td className="py-3 px-5 text-right font-semibold text-foreground text-xs">{row.normal}</td>
                              <td className="py-3 px-5 text-right font-semibold text-foreground text-xs">{row.priority}</td>
                              <td className="py-3 px-5 text-center">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  row.isWorse ? "bg-kpi-red-bg text-kpi-red" : "bg-kpi-green-bg text-kpi-green"
                                }`}>
                                  {row.change}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Priority Recommendation */}
                {priorityEnabled && priorityAnalysis && (
                  <div className={`rounded-xl border-2 p-5 animate-fade-in ${
                    priorityAnalysis.fairnessImpact > 25 ? "border-kpi-red/30 bg-kpi-red-bg"
                      : priorityAnalysis.fairnessImpact > 10 ? "border-kpi-amber/30 bg-kpi-amber-bg"
                      : "border-kpi-green/30 bg-kpi-green-bg"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        priorityAnalysis.fairnessImpact > 25 ? "bg-kpi-red/10" : priorityAnalysis.fairnessImpact > 10 ? "bg-kpi-amber/10" : "bg-kpi-green/10"
                      }`}>
                        <ShieldCheck className={`h-5 w-5 ${
                          priorityAnalysis.fairnessImpact > 25 ? "text-kpi-red" : priorityAnalysis.fairnessImpact > 10 ? "text-kpi-amber" : "text-kpi-green"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground">Priority Service Impact</h4>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            priorityAnalysis.fairnessImpact > 25 ? "bg-kpi-red/20 text-kpi-red"
                              : priorityAnalysis.fairnessImpact > 10 ? "bg-kpi-amber/20 text-kpi-amber"
                              : "bg-kpi-green/20 text-kpi-green"
                          }`}>
                            {priorityAnalysis.fairnessImpact > 25 ? "High Impact" : priorityAnalysis.fairnessImpact > 10 ? "Moderate" : "Balanced"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{priorityAnalysis.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts Row */}
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Main Chart */}
                  <div className="lg:col-span-2 bg-dashboard-card rounded-xl border border-dashboard-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold text-foreground">Waiting Time vs. Capacity</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">How adding {labels.server} reduces waiting time</p>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="waitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(210 80% 45%)" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="hsl(210 80% 45%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
                          <XAxis dataKey="servers" tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false}
                            label={{ value: `# of ${labels.server}`, position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }} />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false}
                            label={{ value: "Wait (min)", angle: -90, position: "insideLeft", offset: 15, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }} />
                          <Tooltip content={<ChartTooltipCustom />} />
                          <Area type="monotone" dataKey="waitingTime" name="Wait Time" stroke="hsl(210 80% 45%)" strokeWidth={2.5}
                            fill="url(#waitAreaGrad)" dot={{ r: 3, fill: "hsl(210 80% 45%)", strokeWidth: 0 }}
                            activeDot={{ r: 5, stroke: "hsl(210 80% 45%)", strokeWidth: 2, fill: "white" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Panel */}
                  <div className="space-y-4">
                    {/* Gauge */}
                    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
                      <h4 className="text-sm font-semibold text-foreground mb-1">System Load</h4>
                      <p className="text-xs text-muted-foreground mb-3">ρ = λ / (c × μ)</p>
                      <div className="h-32 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart cx="50%" cy="80%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={gaugeData} barSize={12}>
                            <defs>
                              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="hsl(160 50% 42%)" />
                                <stop offset="50%" stopColor="hsl(38 92% 50%)" />
                                <stop offset="100%" stopColor="hsl(0 84% 60%)" />
                              </linearGradient>
                            </defs>
                            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "hsl(220 15% 93%)" }} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center -mt-4">
                        <span className={`text-2xl font-bold ${getUtilColor(result.rho).text}`}>{pct(result.rho)}</span>
                        <p className="text-xs text-muted-foreground">{getUtilColor(result.rho).label}</p>
                      </div>
                    </div>

                    {/* Pie */}
                    {pieData.length > 0 && (
                      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
                        <h4 className="text-sm font-semibold text-foreground mb-1">Time in System</h4>
                        <p className="text-xs text-muted-foreground mb-2">Waiting vs. service split</p>
                        <div className="h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                              </Pie>
                              <Tooltip formatter={(value: any) => `${value} min`} contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(220 15% 91%)" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-kpi-amber" />Waiting</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-kpi-blue" />Service</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* What-If Table */}
                <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-dashboard-border flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">What-If Analysis</h4>
                      <p className="text-xs text-muted-foreground">Compare current vs. adding more {labels.server}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-dashboard-bg">
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{labels.server} (c)</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilization (ρ)</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wait Time</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Queue Length</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">P(wait)</th>
                          <th className="text-center py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashboard-border">
                        {whatIfData.map((row, i) => {
                          const uc = getUtilColor(row.rho);
                          return (
                            <tr key={row.servers} className={`hover:bg-dashboard-bg/50 transition-colors ${i === 0 ? "bg-primary/5" : ""}`}>
                              <td className="py-3 px-5 font-semibold text-foreground">
                                {row.servers}
                                {i === 0 && <span className="ml-2 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">Current</span>}
                                {i > 0 && <span className="ml-2 text-[10px] font-medium text-muted-foreground">+{i}</span>}
                              </td>
                              <td className="py-3 px-5 text-right"><span className={`font-semibold ${uc.text}`}>{pct(row.rho)}</span></td>
                              <td className="py-3 px-5 text-right font-semibold text-foreground">{fmt(row.waitMinutes)} min</td>
                              <td className="py-3 px-5 text-right font-semibold text-foreground">{fmt(row.Lq, 1)}</td>
                              <td className="py-3 px-5 text-right font-semibold text-foreground">{pct(row.pWait)}</td>
                              <td className="py-3 px-5 text-center">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${uc.bg} ${uc.text}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{uc.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-dashboard-border flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Detailed Metrics</h4>
                      <p className="text-xs text-muted-foreground">Complete calculation output</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-dashboard-bg">
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metric</th>
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formula</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashboard-border">
                        {[
                          { metric: "Arrival Rate", formula: "λ", value: `${lambda} ${labels.customer}/hr` },
                          { metric: "Service Rate", formula: "μ", value: `${mu} per ${labels.server.replace(/s$/, "")}/hr` },
                          { metric: `Number of ${labels.server}`, formula: "c", value: `${c}` },
                          { metric: "Utilization", formula: "ρ = λ / (c × μ)", value: pct(result.rho) },
                          { metric: "Avg. Waiting Time", formula: "W = ρ / (μ(1-ρ)) × 60", value: `${fmt(result.waitMinutes)} min` },
                          { metric: "Queue Length", formula: "Lq = λ × W", value: `${fmt(result.Lq, 1)} ${labels.customer}` },
                          { metric: "Prob. of Waiting", formula: "P(wait) = ρ^c", value: pct(result.pWait) },
                          { metric: `Daily ${labels.customer}`, formula: "λ × hours", value: `${lambda * hours}` },
                        ].map((row) => (
                          <tr key={row.metric} className="hover:bg-dashboard-bg/50 transition-colors">
                            <td className="py-2.5 px-5 text-foreground">{row.metric}</td>
                            <td className="py-2.5 px-5"><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{row.formula}</code></td>
                            <td className="py-2.5 px-5 text-right font-semibold text-foreground">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Standard Recommendation */}
                <div className={`rounded-xl border-2 p-5 ${
                  rec.severity === "critical" ? "border-kpi-red/30 bg-kpi-red-bg"
                    : rec.severity === "high" ? "border-kpi-amber/30 bg-kpi-amber-bg"
                    : rec.severity === "low" ? "border-kpi-blue/30 bg-kpi-blue-bg"
                    : "border-kpi-green/30 bg-kpi-green-bg"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      rec.severity === "critical" || rec.severity === "high" ? "bg-kpi-red/10" : "bg-kpi-green/10"
                    }`}>
                      {rec.severity === "critical" || rec.severity === "high" ? (
                        <AlertCircle className={`h-5 w-5 ${rec.severity === "critical" ? "text-kpi-red" : "text-kpi-amber"}`} />
                      ) : rec.severity === "low" ? (
                        <Lightbulb className="h-5 w-5 text-kpi-blue" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-kpi-green" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground">Optimization Recommendation</h4>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          rec.severity === "critical" ? "bg-kpi-red/20 text-kpi-red"
                            : rec.severity === "high" ? "bg-kpi-amber/20 text-kpi-amber"
                            : rec.severity === "low" ? "bg-kpi-blue/20 text-kpi-blue"
                            : "bg-kpi-green/20 text-kpi-green"
                        }`}>
                          {rec.severity === "critical" ? "Critical" : rec.severity === "high" ? "Advisory" : rec.severity === "low" ? "Optimize" : "Optimal"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rec.text}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Empty State */}
            {!hasAnalyzed && (
              <div className="bg-dashboard-card rounded-xl border border-dashed border-dashboard-border p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                  <LayoutDashboard className="h-7 w-7 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Ready to Analyze</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Configure parameters above{priorityEnabled ? " with priority queue settings" : ""} and click <strong>Analyze Queue</strong> to generate metrics, charts, and recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoDashboard;
