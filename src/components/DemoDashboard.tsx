import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, RadialBarChart, RadialBar, Cell,
  PieChart, Pie,
} from "recharts";
import {
  Activity, AlertCircle, ArrowDown, ArrowUp, Building2, CheckCircle2,
  Clock, Gauge, Info, LayoutDashboard, Minus, Settings2,
  TrendingUp, Users, Zap,
} from "lucide-react";
import { calculateQueue, generateCapacityData, type QueueInput, type QueueResult } from "@/lib/queueCalculations";

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

/* ─── Helpers ───────────────────────────────────────────────── */
const fmt = (n: number, d = 2) => (n === Infinity ? "∞" : n.toFixed(d));
const pct = (n: number) => (n === Infinity ? "∞" : `${(n * 100).toFixed(1)}%`);

function getUtilColor(rho: number) {
  if (rho > 0.85) return { text: "text-kpi-red", bg: "bg-kpi-red-bg", ring: "ring-kpi-red/20" };
  if (rho > 0.7) return { text: "text-kpi-amber", bg: "bg-kpi-amber-bg", ring: "ring-kpi-amber/20" };
  return { text: "text-kpi-green", bg: "bg-kpi-green-bg", ring: "ring-kpi-green/20" };
}

function getUtilLabel(rho: number) {
  if (rho >= 1) return "Overloaded";
  if (rho > 0.85) return "Critical";
  if (rho > 0.7) return "Moderate";
  if (rho > 0.5) return "Healthy";
  return "Under-utilized";
}

/* ─── Custom Tooltip ────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dashboard-card border border-dashboard-border rounded-lg px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1.5">{label} servers</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-medium text-foreground">{p.value !== null ? p.value : "N/A"}{p.dataKey === "utilization" ? "%" : " min"}</span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const DemoDashboard = () => {
  const [input, setInput] = useState<QueueInput>({
    arrivalRate: 20,
    serviceRate: 8,
    numServers: 3,
    operatingHours: 8,
  });
  const [institution, setInstitution] = useState("hospital");
  const [result, setResult] = useState<QueueResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const labels = institutionLabels[institution];

  const handleAnalyze = () => {
    const r = calculateQueue(input);
    setResult(r);
    setChartData(generateCapacityData(input));
    setHasAnalyzed(true);
  };

  /* utilization gauge data */
  const gaugeData = useMemo(() => {
    if (!result) return [];
    const val = Math.min(result.systemUtilization * 100, 100);
    return [{ name: "Utilization", value: parseFloat(val.toFixed(1)), fill: "url(#gaugeGrad)" }];
  }, [result]);

  /* distribution pie for time in system */
  const timeDistData = useMemo(() => {
    if (!result || result.avgWaitingTime === Infinity) return [];
    const serviceTime = (1 / input.serviceRate) * 60;
    return [
      { name: "Waiting", value: parseFloat(result.avgWaitingTime.toFixed(1)), fill: "hsl(var(--kpi-amber))" },
      { name: "Service", value: parseFloat(serviceTime.toFixed(1)), fill: "hsl(var(--kpi-blue))" },
    ];
  }, [result, input.serviceRate]);

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
            Configure your service environment, run the analysis, and explore professional-grade queue metrics.
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
                <p className="text-xs text-muted-foreground">M/M/c Queue Theory Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasAnalyzed && result && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ring-1 ${getUtilColor(result.systemUtilization).bg} ${getUtilColor(result.systemUtilization).text} ${getUtilColor(result.systemUtilization).ring}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {getUtilLabel(result.systemUtilization)}
                </span>
              )}
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">v2.0</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">

            {/* ─── Configuration Panel ─── */}
            <div className="grid lg:grid-cols-[1fr_auto] gap-4">
              {/* Institution + Params */}
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
                      { label: "Arrival Rate (λ)", sub: `${labels.customer}/hr`, key: "arrivalRate" as const, icon: Users },
                      { label: "Service Rate (μ)", sub: `per ${labels.server.replace(/s$/, "")}/hr`, key: "serviceRate" as const, icon: Zap },
                      { label: `${labels.server.charAt(0).toUpperCase() + labels.server.slice(1)} (c)`, sub: "servers", key: "numServers" as const, icon: Gauge },
                      { label: "Operating Hours", sub: "hours/day", key: "operatingHours" as const, icon: Clock },
                    ].map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <field.icon className="h-3.5 w-3.5" />
                          {field.label}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={input[field.key]}
                          onChange={(e) => setInput({ ...input, [field.key]: Number(e.target.value) || 1 })}
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
                  <Zap className="h-4 w-4" /> Analyze
                </button>
                <p className="text-[10px] text-center text-muted-foreground leading-tight">
                  Run M/M/c queue analysis with current parameters
                </p>
              </div>
            </div>

            {/* ─── Results ─── */}
            {hasAnalyzed && result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {
                      icon: Clock, label: "Avg. Wait Time",
                      value: `${fmt(result.avgWaitingTime)}`, unit: "min",
                      color: "text-kpi-blue", bg: "bg-kpi-blue-bg",
                      trend: result.avgWaitingTime > 15 ? "up" : result.avgWaitingTime > 5 ? "neutral" : "down",
                    },
                    {
                      icon: Users, label: "Queue Length",
                      value: `${fmt(result.avgQueueLength, 1)}`, unit: labels.customer,
                      color: "text-kpi-purple", bg: "bg-kpi-purple-bg",
                      trend: result.avgQueueLength > 5 ? "up" : "down",
                    },
                    {
                      icon: Gauge, label: "Utilization",
                      value: pct(result.systemUtilization), unit: "",
                      color: getUtilColor(result.systemUtilization).text,
                      bg: getUtilColor(result.systemUtilization).bg,
                      trend: result.systemUtilization > 0.85 ? "up" : result.systemUtilization > 0.7 ? "neutral" : "down",
                    },
                    {
                      icon: Activity, label: "Prob. of Waiting",
                      value: pct(result.probWaiting), unit: "",
                      color: "text-kpi-amber", bg: "bg-kpi-amber-bg",
                      trend: result.probWaiting > 0.5 ? "up" : "down",
                    },
                    {
                      icon: TrendingUp, label: `Recommended`,
                      value: `${result.recommendedDoctors}`, unit: labels.server,
                      color: "text-kpi-green", bg: "bg-kpi-green-bg",
                      trend: result.recommendedDoctors > input.numServers ? "up" : "neutral",
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-dashboard-card rounded-xl border border-dashboard-border p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                          <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                        <div className={`flex items-center gap-0.5 text-xs font-medium ${
                          kpi.trend === "up" ? "text-kpi-red" : kpi.trend === "down" ? "text-kpi-green" : "text-muted-foreground"
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
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Main Chart - Capacity Analysis */}
                  <div className="lg:col-span-2 bg-dashboard-card rounded-xl border border-dashboard-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Capacity Analysis</h4>
                        <p className="text-xs text-muted-foreground">Wait time & utilization vs. number of {labels.server}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-kpi-blue" />Wait Time</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-kpi-green" />Utilization</span>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(210 80% 45%)" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="hsl(210 80% 45%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(160 50% 42%)" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="hsl(160 50% 42%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
                          <XAxis
                            dataKey="doctors"
                            tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: `# of ${labels.server}`, position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "hsl(215 15% 50%)" } }}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="waitingTime" name="Wait Time" stroke="hsl(210 80% 45%)" strokeWidth={2} fill="url(#waitGrad)" dot={{ r: 3, fill: "hsl(210 80% 45%)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                          <Area type="monotone" dataKey="utilization" name="Utilization" stroke="hsl(160 50% 42%)" strokeWidth={2} fill="url(#utilGrad)" dot={{ r: 3, fill: "hsl(160 50% 42%)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Panel - Gauge + Pie */}
                  <div className="space-y-4">
                    {/* Utilization Gauge */}
                    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
                      <h4 className="text-sm font-semibold text-foreground mb-1">System Load</h4>
                      <p className="text-xs text-muted-foreground mb-3">Server utilization (ρ)</p>
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
                            <RadialBar
                              dataKey="value"
                              cornerRadius={6}
                              background={{ fill: "hsl(220 15% 93%)" }}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center -mt-4">
                        <span className={`text-2xl font-bold ${getUtilColor(result.systemUtilization).text}`}>
                          {pct(result.systemUtilization)}
                        </span>
                        <p className="text-xs text-muted-foreground">{getUtilLabel(result.systemUtilization)}</p>
                      </div>
                    </div>

                    {/* Time Distribution */}
                    {timeDistData.length > 0 && (
                      <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
                        <h4 className="text-sm font-semibold text-foreground mb-1">Time in System</h4>
                        <p className="text-xs text-muted-foreground mb-2">Waiting vs. service split</p>
                        <div className="h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={timeDistData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                {timeDistData.map((entry, i) => (
                                  <Cell key={i} fill={entry.fill} />
                                ))}
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

                {/* Detailed Metrics Table */}
                <div className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-dashboard-border flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Detailed Queue Metrics</h4>
                      <p className="text-xs text-muted-foreground">Complete M/M/c model output</p>
                    </div>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-dashboard-bg">
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metric</th>
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashboard-border">
                        {[
                          { metric: "Arrival Rate", symbol: "λ", value: `${input.arrivalRate} ${labels.customer}/hr` },
                          { metric: "Service Rate", symbol: "μ", value: `${input.serviceRate} ${labels.customer}/hr` },
                          { metric: `Number of ${labels.server}`, symbol: "c", value: `${input.numServers}` },
                          { metric: "Server Utilization", symbol: "ρ", value: pct(result.utilization) },
                          { metric: "Avg. Waiting Time", symbol: "Wq", value: `${fmt(result.avgWaitingTime)} min` },
                          { metric: "Avg. System Time", symbol: "W", value: `${fmt(result.avgSystemTime)} min` },
                          { metric: "Avg. Queue Length", symbol: "Lq", value: `${fmt(result.avgQueueLength, 1)} ${labels.customer}` },
                          { metric: `Avg. ${labels.customer} in System`, symbol: "L", value: `${fmt(result.avgPatientsInSystem, 1)} ${labels.customer}` },
                          { metric: "Probability of Waiting", symbol: "P(wait)", value: pct(result.probWaiting) },
                          { metric: `Daily ${labels.customer}`, symbol: "N", value: `${result.totalPatientsPerDay}` },
                          { metric: `Recommended ${labels.server}`, symbol: "c*", value: `${result.recommendedDoctors}` },
                        ].map((row) => (
                          <tr key={row.metric} className="hover:bg-dashboard-bg/50 transition-colors">
                            <td className="py-2.5 px-5 text-foreground">{row.metric}</td>
                            <td className="py-2.5 px-5">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{row.symbol}</code>
                            </td>
                            <td className="py-2.5 px-5 text-right font-semibold text-foreground">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommendation Card */}
                <div className={`rounded-xl border-2 p-5 ${
                  result.utilization > 0.85
                    ? "border-kpi-red/30 bg-kpi-red-bg"
                    : result.utilization > 0.7
                    ? "border-kpi-amber/30 bg-kpi-amber-bg"
                    : "border-kpi-green/30 bg-kpi-green-bg"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      result.utilization > 0.85 ? "bg-kpi-red/10" : "bg-kpi-green/10"
                    }`}>
                      {result.utilization > 0.85 ? (
                        <AlertCircle className="h-5 w-5 text-kpi-red" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-kpi-green" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground">Optimization Recommendation</h4>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          result.utilization > 0.85
                            ? "bg-kpi-red/20 text-kpi-red"
                            : result.utilization > 0.7
                            ? "bg-kpi-amber/20 text-kpi-amber"
                            : "bg-kpi-green/20 text-kpi-green"
                        }`}>
                          {result.utilization > 0.85 ? "Action Required" : result.utilization > 0.7 ? "Advisory" : "Optimal"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.recommendation}</p>
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
                  Configure your service parameters above and click <strong>Analyze</strong> to generate queue performance metrics, charts, and optimization recommendations.
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
