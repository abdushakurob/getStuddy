import { Calendar, Layers, ParkingCircle, CheckCircle } from "lucide-react";

const features = [
  {
    id: "negotiated-planning",
    title: "Your Schedule. Your Rules.",
    description:
      "Tell goStuddy you have 20 minutes and it builds a custom high-yield roadmap. Tired? It adjusts. Hyper-focused? It challenges you. Plans are negotiated, not dictated.",
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
      "The companion auto-scrolls your PDF to the right page, seeks your lecture video to the right timestamp, and cross-references across all your materials — automatically.",
    bullets: ["Auto-pilot navigation", "Clickable citations [Page 42]", "Cross-modal synthesis"],
    icon: Layers,
    mockup: (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5 relative min-h-[220px] flex items-center justify-center overflow-hidden group">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground absolute top-5 left-5">Workspace</div>

        {/* Stacked Effect - PDF is Base Layer (Z-10), Media Floats on Top (Z-20, Z-30) */}
        <div className="relative w-full max-w-[280px] h-[180px] mt-4">

          {/* Base Layer - PDF Reader */}
          <div className="absolute inset-0 top-6 bg-white rounded-xl border border-border shadow-sm p-4 z-10 flex flex-col gap-2 scale-100 opacity-60 blur-[1px] group-hover:blur-0 group-hover:opacity-80 transition-all duration-500">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center text-red-500 text-[8px] font-bold">PDF</div>
              <div className="h-2 w-24 bg-gray-100 rounded"></div>
            </div>
            <div className="space-y-1.5 opacity-50">
              <div className="h-2 w-full bg-gray-100 rounded"></div>
              <div className="h-2 w-[90%] bg-gray-100 rounded"></div>
              <div className="h-2 w-[95%] bg-gray-100 rounded"></div>
              <div className="h-2 w-[80%] bg-gray-100 rounded"></div>
              <div className="h-2 w-[85%] bg-gray-100 rounded"></div>
            </div>
          </div>

          {/* Middle Layer - Audio Player (Floating Pills) */}
          <div className="absolute bottom-4 right-4 bg-purple-50/90 backdrop-blur-sm rounded-full border border-purple-100 shadow-md flex items-center gap-3 px-3 py-1.5 z-20 transform translate-x-4 group-hover:translate-x-0 transition-transform duration-500 delay-100">
            <div className="flex gap-0.5 h-3 items-end">
              <div className="w-1 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1.5 bg-purple-400 rounded-full animate-pulse delay-150"></div>
            </div>
            <div className="text-[10px] font-medium text-purple-700">Audio Note</div>
          </div>

          {/* Top Layer - Video Player (Floating Overlay) */}
          <div className="absolute top-0 right-0 left-8 h-28 bg-blue-50/90 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg flex flex-col items-center justify-center z-30 transform -translate-y-2 translate-x-2 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-500">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-500 shadow-sm border border-blue-200">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full w-[40%] bg-blue-500"></div>
              </div>
              <div className="text-[8px] font-mono text-blue-600">14:20</div>
            </div>
          </div>

        </div>
      </div>
    ),
  },
  {
    id: "parking-lot",
    title: "Curiosity Without Distraction",
    description:
      "Off-topic thought? The companion parks it for later. Stay in flow now, explore rabbit holes after the mission is complete. Never lose a good question.",
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
            className={`flex flex-col items-center gap-12 md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""
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
