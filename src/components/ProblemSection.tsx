import { AlertTriangle, Clock, TrendingDown, Users } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Excessive Wait Times",
    description: "Patients spend an average of 45–90 minutes waiting due to unpredictable arrival patterns and poor scheduling.",
  },
  {
    icon: Users,
    title: "Inefficient Staffing",
    description: "Hospitals often over-staff during slow periods and under-staff during peak hours, wasting valuable resources.",
  },
  {
    icon: TrendingDown,
    title: "Low Patient Satisfaction",
    description: "Long queues lead to patient dissatisfaction, missed appointments, and negative impacts on hospital reputation.",
  },
  {
    icon: AlertTriangle,
    title: "No Data-Driven Decisions",
    description: "Most capacity planning relies on intuition rather than mathematical models, leading to suboptimal outcomes.",
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">The Problem</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Why Hospital Queues Need Optimization</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hospitals face long waiting lines due to inefficient capacity planning and unpredictable patient arrivals,
            resulting in poor patient experience and wasted resources.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {problems.map((p) => (
            <div key={p.title} className="bg-background rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <p.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
