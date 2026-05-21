import { Users } from "lucide-react";

const team = [
  { name: "İlayda Coşar", role: "Operations Research Lead", initials: "IC" },
  { name: "Elvin Çalıklı", role: "Capacity Planning Analyst", initials: "EC" },
  { name: "Ece Sude Gül", role: "Product Manager", initials: "ESG" },
  { name: "Berk Kazankıran", role: "Platform Engineer", initials: "BK" },
];

const TeamSection = () => {
  return (
    <section id="team" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <Users className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Leadership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Meet the Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A multidisciplinary team of operations researchers, product leaders, and engineers building the next generation of capacity intelligence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {team.map((m) => (
            <div key={m.name} className="bg-background rounded-2xl p-6 card-shadow text-center hover:card-shadow-hover transition-shadow">
              <div className="w-20 h-20 rounded-full gradient-bg mx-auto flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl">
                {m.initials}
              </div>
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
