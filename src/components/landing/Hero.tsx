import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="px-6 pb-16 pt-20 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-heading text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl">
          Stop Managing.
          <br />
          Start Learning.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          An AI agent that manages your study sessions so you can focus purely on
          understanding. You do the learning. It handles the logistics.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="/login">
            <Button size="lg" className="bg-primary px-8 text-primary-foreground hover:bg-primary/90">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="px-8">
              See How It Works
            </Button>
          </a>
        </div>
      </div>

      {/* Product mockup */}
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <div className="h-3 w-3 rounded-full bg-primary/60" />
            </div>
            <div className="ml-4 flex-1 rounded-md bg-background px-4 py-1 text-xs text-muted-foreground shadow-sm">
              studdy.ai/dashboard
            </div>
          </div>

          {/* App Mockup */}
          <div className="flex h-[500px] bg-background">
            {/* Sidebar */}
            <div className="hidden w-64 flex-col border-r border-border bg-sidebar p-4 md:flex">
              <div className="mb-6 flex items-center gap-2 px-2">
                <div className="h-6 w-6 rounded bg-primary"></div>
                <span className="font-heading font-bold text-sidebar-foreground">Studdy</span>
              </div>
              <div className="space-y-1">
                <div className="rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground">
                  Biology 101
                </div>
                <div className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
                  React Patterns
                </div>
                <div className="rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
                  History of Art
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-sidebar-border">
                <div className="flex items-center gap-2 px-2 text-sm text-sidebar-foreground/70">
                  <div className="h-2 w-full rounded bg-sidebar-accent overflow-hidden">
                    <div className="h-full w-3/4 bg-primary"></div>
                  </div>
                  <span>75%</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid md:grid-cols-2">
              {/* Chat Column */}
              <div className="flex flex-col border-r border-border bg-background">
                <div className="border-b border-border p-4">
                  <div className="text-sm font-semibold text-foreground">Director Agent</div>
                  <div className="text-xs text-muted-foreground">Session: Cell Division</div>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-hidden">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                      I need to understand the phases of Mitosis.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground shadow-sm">
                      Got it. Let's break down Prophase, Metaphase, Anaphase, and Telophase. I've pulled up the diagram on Page 42.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground shadow-sm">
                      <p className="mb-2 font-medium">Ready to start?</p>
                      <div className="flex gap-2">
                        <button className="rounded-md bg-background px-3 py-1.5 text-xs font-medium border border-border shadow-sm hover:bg-accent/10">Yes, let's go</button>
                        <button className="rounded-md bg-background px-3 py-1.5 text-xs font-medium border border-border shadow-sm hover:bg-accent/10">Wait, one sec</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    Type a message...
                  </div>
                </div>
              </div>

              {/* Resource Column */}
              <div className="hidden flex-col bg-muted/30 md:flex">
                <div className="border-b border-border p-4 bg-background flex justify-between items-center">
                  <div className="text-sm font-medium text-foreground">Biology_Textbook.pdf</div>
                  <div className="text-xs text-muted-foreground">Page 42 of 305</div>
                </div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                  <div className="w-full max-w-[80%] aspect-[3/4] bg-white shadow-sm border border-border rounded-sm p-8 flex flex-col gap-4">
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-100 rounded"></div>

                    <div className="mt-4 aspect-square w-full bg-primary/5 border-2 border-dashed border-primary/20 rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-primary uppercase tracking-widest">Mitosis Diagram</span>
                    </div>

                    <div className="mt-2 h-4 w-full bg-gray-100 rounded"></div>
                    <div className="h-4 w-4/5 bg-gray-100 rounded"></div>
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
