import { ClipboardList, BarChart3, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Enter System Parameters",
    description: "Input patient arrival rate, service rate, number of doctors, and operating hours into the system.",
  },
  {
    icon: BarChart3,
    step: "02",
    title: "Analyze Queue Performance",
    description: "MediQueue applies M/M/c queue theory models to calculate key performance metrics and identify bottlenecks.",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Receive Optimization Recommendations",
    description: "Get data-driven recommendations for optimal staffing levels, expected wait times, and resource allocation.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Three Simple Steps</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From input to insight in seconds — powered by proven operations research methodologies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              <div className="w-24 h-24 rounded-full gradient-bg mx-auto flex items-center justify-center mb-6 relative z-10">
                <s.icon className="h-10 w-10 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Step {s.step}</span>
              <h3 className="font-bold text-xl mt-2 mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
