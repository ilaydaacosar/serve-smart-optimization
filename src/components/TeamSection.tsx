import { Users, Linkedin, Mail } from "lucide-react";

const team = [
  {
    name: "İlayda Coşar",
    role: "Industrial Engineering Student",
    initials: "İC",
    department: "Operations & Process",
  },
  {
    name: "Elvin Çalıklı",
    role: "Industrial Engineering Student",
    initials: "EÇ",
    department: "Operations & Process",
  },
  {
    name: "Ece Sude Gül",
    role: "Industrial Engineering Student",
    initials: "ESG",
    department: "Operations & Process",
  },
  {
    name: "Berk Kazankıran",
    role: "Computer Engineering Student",
    initials: "BK",
    department: "Product & Engineering",
  },
];

const TeamSection = () => {
  return (
    <section id="team" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <Users className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">TEAM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Meet the Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto whitespace-pre-line">
            Product Development and Management course project by Engineering students.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {team.map((m) => (
            <div
              key={m.name}
              className="group bg-background rounded-2xl p-6 card-shadow text-center hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 border border-border/50"
            >
              <div className="w-20 h-20 rounded-full gradient-bg mx-auto flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl shadow-lg">
                {m.initials}
              </div>
              <h3 className="font-semibold text-lg">{m.name}</h3>
              <p className="text-sm text-primary font-medium mt-1">{m.role}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-3">
                {m.department}
              </span>
              <div className="flex items-center justify-center gap-3 mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Email">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
