import { Calendar, Layers, ParkingCircle, CheckCircle } from "lucide-react";

const features = [
  {
    id: "negotiated-planning",
    title: "Your Schedule. Your Rules.",
    description:
      "Tell Studdy you have 20 minutes and it builds a custom high-yield roadmap. Tired? It adjusts. Hyper-focused? It challenges you. Plans are negotiated, not dictated.",
    bullets: ["Dynamic schedule adjustment", "Collaborative goal setting", "Responds to your energy levels"],
    icon: Calendar,
    mockup: (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chat</div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          Here is the full 2-hour plan for Chapter 4.
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-foreground">
          Too long. I have soccer practice in an hour.
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="text-xs font-bold uppercase text-primary">Plan Updated</div>
          <div className="mt-1 text-sm font-medium text-foreground">New Mission: 45-Minute Sprint</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Focusing on high-yield concepts from summary.</div>
        </div>
      </div>
    ),
  },
  {
    id: "multimodal-workspace",
    title: "PDFs. Videos. Diagrams. All in Sync.",
    description:
      "The agent auto-scrolls your PDF to the right page, seeks your lecture video to the right timestamp, and cross-references across all your materials — automatically.",
    bullets: ["Auto-pilot navigation", "Clickable citations [Page 42]", "Cross-modal synthesis"],
    icon: Layers,
    mockup: (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">PDF Viewer</div>
            <div className="space-y-1.5">
              <div className="h-2 rounded bg-border" style={{ width: "90%" }} />
              <div className="h-2 rounded bg-border" style={{ width: "70%" }} />
              <div className="h-8 rounded bg-primary/10" />
              <div className="h-2 rounded bg-border" style={{ width: "80%" }} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Video</div>
            <div className="flex h-20 items-center justify-center rounded bg-foreground/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">▶</div>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">Lecture_04.mp4 — 14:20</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "parking-lot",
    title: "Curiosity Without Distraction",
    description:
      "Off-topic thought? The agent parks it for later. Stay in flow now, explore rabbit holes after the mission is complete. Never lose a good question.",
    bullets: ["Protect your flow state", "Never lose a good question", "Dedicated exploration time"],
    icon: ParkingCircle,
    mockup: (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parking Lot</div>
        <div className="space-y-2">
          {[
            "Is this related to quantum tunneling?",
            "Check professor's email about the midterm",
            "Look up that Nature paper on CRISPR",
          ].map((q) => (
            <div key={q} className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <ParkingCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="text-xs text-foreground">{q}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          ✓ Parked. Staying on topic.
        </div>
      </div>
    ),
  },
];

const FeatureDeepDives = () => {
  return (
    <section id="features" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl space-y-24">
        {features.map((feature, i) => (
          <div
            key={feature.id}
            className={`flex flex-col items-center gap-12 md:flex-row ${
              i % 2 === 1 ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Text */}
            <div className="flex-1">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                {feature.title}
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">{feature.description}</p>
              <ul className="mt-5 space-y-2">
                {feature.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            {/* Mockup */}
            <div className="w-full max-w-md flex-1">{feature.mockup}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureDeepDives;
