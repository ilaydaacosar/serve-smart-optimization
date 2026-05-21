import { ArrowRight, Activity, Clock, Users } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-medical-blue-light rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-medical-green-light rounded-full blur-3xl opacity-40" />
      </div>

      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-medical-blue-light text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Activity className="h-4 w-4" />
          Queue Theory × Service Optimization
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="gradient-text">ServeSmart</span>
        </h1>

        <p className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
          Optimize Service Flow, Reduce Waiting Time
        </p>

        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
          An Industrial Engineering decision support system that optimizes service queues
          using queue theory (M/M/c models) and operations research to reduce waiting
          times and improve efficiency across hospitals, banks, and service centers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="#demo" className="gradient-bg text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg">
            Launch Console <ArrowRight className="h-5 w-5" />
          </a>
          <a href="#features" className="border border-border bg-card text-foreground px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center hover:bg-muted transition-colors">
            Learn More
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Clock, label: "Avg. Wait Reduction", value: "40%" },
            { icon: Users, label: "Resource Optimization", value: "25%" },
            { icon: Activity, label: "Throughput Increase", value: "35%" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card card-shadow rounded-2xl p-6 flex flex-col items-center">
              <stat.icon className="h-8 w-8 text-primary mb-2" />
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
