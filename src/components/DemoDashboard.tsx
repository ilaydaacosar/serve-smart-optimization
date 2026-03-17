import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, AlertCircle, Building2, CheckCircle, Clock, TrendingUp, Users, Zap } from "lucide-react";
import { calculateQueue, generateCapacityData, type QueueInput, type QueueResult } from "@/lib/queueCalculations";

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

  const labels = institutionLabels[institution];

  const handleAnalyze = () => {
    const r = calculateQueue(input);
    setResult(r);
    setChartData(generateCapacityData(input));
  };

  const formatNum = (n: number) => (n === Infinity ? "∞" : n.toFixed(2));

  return (
    <section id="demo" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Interactive Demo</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Queue Optimization Dashboard</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your institution type, enter parameters, and analyze queue performance using M/M/c queue theory models.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Institution Type Selector */}
          <div className="bg-card rounded-2xl card-shadow p-6 sm:p-8 mb-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Institution Type
            </h3>
            <div className="flex flex-wrap gap-3">
              {institutionTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setInstitution(t.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    institution === t.value
                      ? "gradient-bg text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="bg-card rounded-2xl card-shadow p-6 sm:p-8 mb-8">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Parameters
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Arrival Rate", sub: `${labels.customer}/hour`, key: "arrivalRate" as const },
                { label: "Avg. Service Rate", sub: `${labels.customer}/hour/${labels.server.slice(0, -1)}`, key: "serviceRate" as const },
                { label: `Number of ${labels.server.charAt(0).toUpperCase() + labels.server.slice(1)}`, sub: "service counters", key: "numServers" as const },
                { label: "Operating Hours", sub: "hours/day", key: "operatingHours" as const },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                  <input
                    type="number"
                    min={1}
                    value={input[field.key]}
                    onChange={(e) => setInput({ ...input, [field.key]: Number(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">{field.sub}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              className="mt-6 gradient-bg text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <Zap className="h-4 w-4" /> Analyze Queue
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPI Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Clock, label: "Avg. Waiting Time", value: `${formatNum(result.avgWaitingTime)} min`, color: "text-primary" },
                  { icon: Users, label: "Avg. Queue Length", value: `${formatNum(result.avgQueueLength)} ${labels.customer}`, color: "text-secondary" },
                  { icon: TrendingUp, label: "System Utilization", value: `${formatNum(result.systemUtilization * 100)}%`, color: result.systemUtilization > 0.85 ? "text-destructive" : "text-primary" },
                  { icon: Activity, label: "Prob. of Waiting", value: `${formatNum(result.probWaiting * 100)}%`, color: "text-secondary" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-card rounded-2xl card-shadow p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                      <span className="text-sm text-muted-foreground">{kpi.label}</span>
                    </div>
                    <span className="text-2xl font-bold">{kpi.value}</span>
                  </div>
                ))}
              </div>

              {/* Results Table */}
              <div className="bg-card rounded-2xl card-shadow p-6">
                <h3 className="font-semibold text-lg mb-4">Detailed Queue Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Arrival Rate (λ)", `${input.arrivalRate} ${labels.customer}/hr`],
                        ["Service Rate per Server (μ)", `${input.serviceRate} ${labels.customer}/hr`],
                        [`Number of ${labels.server} (c)`, `${input.numServers}`],
                        ["Server Utilization (ρ)", `${formatNum(result.utilization * 100)}%`],
                        ["Avg. Waiting Time (Wq)", `${formatNum(result.avgWaitingTime)} minutes`],
                        ["Avg. Time in System (W)", `${formatNum(result.avgSystemTime)} minutes`],
                        ["Avg. Queue Length (Lq)", `${formatNum(result.avgQueueLength)} ${labels.customer}`],
                        [`Avg. ${labels.customer} in System (L)`, `${formatNum(result.avgPatientsInSystem)} ${labels.customer}`],
                        ["Probability of Waiting", `${formatNum(result.probWaiting * 100)}%`],
                        [`Total ${labels.customer} per Day`, `${result.totalPatientsPerDay}`],
                        [`Recommended ${labels.server}`, `${result.recommendedDoctors}`],
                      ].map(([metric, value]) => (
                        <tr key={metric} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 px-4">{metric}</td>
                          <td className="py-2.5 px-4 text-right font-medium">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-card rounded-2xl card-shadow p-6">
                <h3 className="font-semibold text-lg mb-4">Waiting Time vs. Number of {labels.server.charAt(0).toUpperCase() + labels.server.slice(1)}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                      <XAxis dataKey="doctors" label={{ value: `Number of ${labels.server}`, position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Wait Time (min)", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(214, 20%, 90%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="waitingTime" name="Waiting Time (min)" stroke="hsl(210, 80%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="utilization" name="Utilization (%)" stroke="hsl(160, 45%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`rounded-2xl p-6 border-2 ${result.utilization > 0.85 ? "border-destructive/30 bg-destructive/5" : result.utilization > 0.7 ? "border-primary/30 bg-medical-blue-light" : "border-secondary/30 bg-medical-green-light"}`}>
                <div className="flex items-start gap-3">
                  {result.utilization > 0.85 ? (
                    <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Optimization Recommendation</h3>
                    <p className="text-muted-foreground leading-relaxed">{result.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DemoDashboard;
