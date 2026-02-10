import { Upload, MessageSquare, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "1",
    title: "Upload",
    description: "Add your PDFs and paste YouTube lecture links. Studdy reads and indexes everything.",
  },
  {
    icon: MessageSquare,
    number: "2",
    title: "Negotiate",
    description: "Tell the agent your time, energy level, and goals. It builds a custom study plan.",
  },
  {
    icon: GraduationCap,
    number: "3",
    title: "Learn",
    description: "The agent guides you through materials, keeps you focused, and tracks your progress.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
            From Upload to Understanding
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Three steps. That's all it takes to transform how you study.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {step.number}
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
