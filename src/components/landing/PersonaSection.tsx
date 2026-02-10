import { Compass, Zap, Handshake } from "lucide-react";

const personas = [
  {
    icon: Compass,
    emoji: "🧭",
    title: "Guide",
    description: "Supportive and explanatory when you're exploring new, unfamiliar concepts.",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Challenger",
    description: "Quizzes you and pushes deeper when it detects you're coasting through easy material.",
  },
  {
    icon: Handshake,
    emoji: "🤝",
    title: "Supporter",
    description: "Breaks things down step-by-step and adjusts pace when you're stuck or frustrated.",
  },
];

const PersonaSection = () => {
  return (
    <section className="bg-muted/50 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
            Adaptive Learning Modes
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Studdy detects your engagement level and switches modes to keep you in flow.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {personas.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border bg-card p-6 text-center transition-shadow hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <p.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonaSection;
