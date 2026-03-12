import { Clock, TrendingUp, Zap, Database } from "lucide-react";

const benefits = [
  { icon: Clock, value: "40%", label: "Reduced Patient Waiting Time", description: "Significantly shorter queues through optimized resource allocation." },
  { icon: TrendingUp, value: "25%", label: "Improved Resource Utilization", description: "Better staff scheduling reduces idle time and overtime costs." },
  { icon: Zap, value: "35%", label: "Better Service Efficiency", description: "Streamlined patient flow increases throughput without extra resources." },
  { icon: Database, value: "100%", label: "Data-Driven Operations", description: "Replace guesswork with mathematical models for capacity decisions." },
];

const BenefitsSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Benefits</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Measurable Impact on Hospital Operations</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((b) => (
            <div key={b.label} className="bg-card rounded-2xl p-6 card-shadow text-center hover:card-shadow-hover transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-medical-green-light mx-auto flex items-center justify-center mb-4">
                <b.icon className="h-7 w-7 text-secondary" />
              </div>
              <span className="text-3xl font-extrabold gradient-text">{b.value}</span>
              <h3 className="font-semibold mt-2 mb-1">{b.label}</h3>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
