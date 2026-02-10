import { Search, Video, ListChecks, Brain } from "lucide-react";

const problems = [
  {
    icon: Search,
    title: "Where was that diagram?",
    description: "You know you saw it somewhere — page 42? 67? You spend 10 minutes hunting instead of studying.",
  },
  {
    icon: Video,
    title: "Which video explains this?",
    description: "You've got 5 lecture recordings and no idea which one covers the topic you're stuck on.",
  },
  {
    icon: ListChecks,
    title: "What should I study next?",
    description: "Without a clear plan, every session starts with decision paralysis instead of actual learning.",
  },
  {
    icon: Brain,
    title: "I keep losing focus",
    description: "One off-topic thought leads to a 30-minute rabbit hole. Your study time evaporates.",
  },
];

const ProblemSection = () => {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
            Studying Shouldn't Feel Like
            <br />
            Project Management
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sound familiar? You're not alone. Most students spend more time organizing than actually learning.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
