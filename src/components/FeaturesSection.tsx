import { BarChart3, Brain, Gauge, LineChart, Settings2, Users } from "lucide-react";

const features = [
  { icon: LineChart, title: "Patient Flow Analysis", description: "Track and analyze patient arrival patterns using statistical models to identify bottlenecks." },
  { icon: Clock, title: "Waiting Time Prediction", description: "Predict expected waiting times using M/M/c queue theory models with high accuracy." },
  { icon: Settings2, title: "Capacity Planning", description: "Determine the optimal number of service counters based on demand patterns and service rates." },
  { icon: Gauge, title: "Queue Performance Metrics", description: "Monitor key metrics like utilization, queue length, and service levels in real-time." },
  { icon: Users, title: "Service Counter Optimization", description: "Get data-driven recommendations for staffing levels across different time periods." },
  { icon: Brain, title: "Operations Research Models", description: "Leverage proven OR techniques including M/M/1 and M/M/c models for decision support." },
];

import { Clock } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Powerful Queue Optimization Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            MediQueue combines queue theory with intuitive dashboards to provide actionable insights for hospital operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-medical-blue-light group-hover:bg-medical-green-light flex items-center justify-center mb-4 transition-colors">
                <f.icon className="h-6 w-6 text-primary group-hover:text-secondary transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
