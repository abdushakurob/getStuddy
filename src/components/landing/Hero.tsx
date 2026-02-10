import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquare, ZoomIn, ZoomOut, MoreHorizontal, Maximize2 } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-20 md:pb-24 md:pt-32">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none" />

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <h1 className="font-heading text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl">
          Stop Managing.
          <br />
          Start Learning.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          An AI study companion that guides your study sessions so you can focus purely on
          understanding. You do the learning. It handles the logistics.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="/login">
            <Button size="lg" className="bg-primary px-8 text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="px-8 backdrop-blur-sm bg-background/50 hover:bg-background/80">
              See How It Works
            </Button>
          </a>
        </div>
      </div>

      {/* Product mockup */}
      <div className="mx-auto mt-16 max-w-6xl relative z-10">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">

          {/* Browser chrome - Glass */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/20 px-4 py-3 backdrop-blur-md">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/80 shadow-inner" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80 shadow-inner" />
              <div className="h-3 w-3 rounded-full bg-green-500/80 shadow-inner" />
            </div>
            {/* Address Bar */}
            <div className="ml-4 flex-1 rounded-md bg-black/5 border border-white/5 px-4 py-1.5 text-xs text-muted-foreground shadow-inner flex justify-center items-center backdrop-blur-sm">
              <span className="opacity-70">gostuddy.live/dashboard</span>
            </div>
          </div>

          {/* App Mockup - Glass Container */}
          <div className="flex h-[600px] bg-white/40 backdrop-blur-3xl">

            {/* Left Column: Document Viewer (Abstract) */}
            <div className="flex flex-1 flex-col border-r border-white/10 bg-white/30 relative">
              {/* PDF Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-white/40 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-red-100/80 flex items-center justify-center shadow-sm">
                    <span className="text-red-600 font-bold text-xs">PDF</span>
                  </div>
                  <div className="text-sm font-medium text-foreground/80">Lecture_04_Behavioral_Econ.pdf</div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2 text-xs bg-black/5 px-2 py-1 rounded border border-white/20">
                    <span className="font-mono opacity-70">14 / 32</span>
                  </div>
                  <div className="flex gap-2 opacity-70">
                    <ZoomOut className="h-4 w-4" />
                    <ZoomIn className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* PDF Content Area */}
              <div className="flex-1 p-8 flex justify-center items-start overflow-hidden relative">
                {/* Inner Shadow for depth */}
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10" />

                <div className="h-[120%] w-full max-w-3xl bg-white shadow-xl shadow-black/5 border border-white/40 rounded-sm p-12 space-y-6 relative z-0">
                  {/* Header */}
                  <div className="border-b border-gray-100 pb-4 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800/90">The Endowment Effect</h2>
                    <p className="text-sm text-gray-500 mt-1">Chapter 4: Loss Aversion & Ownership</p>
                  </div>

                  {/* Content Blocks */}
                  <div className="space-y-4 opacity-80">
                    <div className="h-4 w-full bg-gray-100/80 rounded"></div>
                    <div className="h-4 w-[98%] bg-gray-100/80 rounded"></div>
                    <div className="h-4 w-[92%] bg-gray-100/80 rounded"></div>
                    <div className="h-4 w-[96%] bg-gray-100/80 rounded"></div>
                  </div>

                  {/* Highlighted Section */}
                  <div className="relative pl-4 border-l-4 border-yellow-400/80 bg-yellow-50/60 p-4 rounded-r backdrop-blur-sm">
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Definition</p>
                    <div className="space-y-2">
                      <div className="h-3 w-[90%] bg-yellow-200/50 rounded"></div>
                      <div className="h-3 w-[80%] bg-yellow-200/50 rounded"></div>
                    </div>
                  </div>

                  <div className="flex gap-6 py-6">
                    <div className="flex-1 space-y-3 opacity-80">
                      <div className="h-3 w-full bg-gray-100/80 rounded"></div>
                      <div className="h-3 w-[85%] bg-gray-100/80 rounded"></div>
                      <div className="h-3 w-[95%] bg-gray-100/80 rounded"></div>
                    </div>
                    <div className="w-1/3 bg-blue-50/50 rounded border border-blue-100/50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="h-16 w-16 bg-blue-200/50 rounded-full mx-auto mb-2"></div>
                        <div className="h-2 w-12 bg-blue-200/50 rounded mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Chat (Sidebar style) */}
            <div className="w-[400px] flex flex-col border-l border-white/10 bg-white/40 backdrop-blur-md hidden lg:flex relative">
              {/* Header */}
              <div className="border-b border-white/10 bg-white/30 p-4 backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground/90">Behavioral Economics</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">Session Active</span>
                    </div>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground/70" />
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-5 space-y-6 overflow-hidden flex flex-col justify-end pb-8">

                {/* User Bubble - Glassy */}
                <div className="flex justify-end">
                  <div className="bg-white/60 backdrop-blur-md border border-white/20 shadow-sm px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-foreground/90 max-w-[85%]">
                    Wait, how does this relate to the previous chapter on Sunk Costs?
                  </div>
                </div>

                {/* Agent Bubble - Glassy */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 text-primary-foreground shadow-md">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="space-y-3 max-w-[90%]">
                    <div className="text-sm leading-relaxed text-foreground/90">
                      Great connection. Both stem from <span className="font-medium text-emerald-600">Loss Aversion</span>.
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90">
                      With Sunk Costs, you don't want to "lose" past investment. With Endowment Effect, you overvalue what you already "own".
                    </div>

                    {/* Citation Card - Glassy */}
                    <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/50 p-3 shadow-sm hover:bg-white/70 cursor-pointer transition-all group backdrop-blur-sm">
                      <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shadow-sm">
                        <span className="text-[10px] font-bold">PDF</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-foreground/90 group-hover:text-primary transition-colors">Kahneman_1990.pdf</div>
                        <div className="text-[10px] text-muted-foreground">Page 14 • "Instant Endowment"</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area - Glassy */}
              <div className="p-4 border-t border-white/10 bg-white/30 backdrop-blur-md">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-white/80">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-white/40 border border-white/20 rounded-full py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/60 transition-all placeholder:text-muted-foreground/70 shadow-inner"
                    placeholder="Ask a follow-up..."
                    disabled
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md transition-transform group-hover:scale-105">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
