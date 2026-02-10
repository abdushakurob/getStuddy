import { Badge } from "@/components/ui/badge";

const pills = ["Agency over Chat", "Flow State as a Service", "Active Learning"];

const SolutionSection = () => {
  return (
    <section className="bg-foreground px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-3xl font-bold text-background md:text-5xl">
          Not a Chatbot. A Director.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-background/70">
          Studdy doesn't just answer your questions — it <strong className="text-background">manages your entire study session</strong>. 
          It plans, navigates your materials, keeps you focused, and adapts when life gets in the way.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {pills.map((pill) => (
            <Badge
              key={pill}
              variant="outline"
              className="border-background/30 px-4 py-2 text-sm font-medium text-background/90"
            >
              {pill}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
