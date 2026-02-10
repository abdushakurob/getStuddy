import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-4xl font-bold text-foreground md:text-6xl">
          Your Logistics. Handled.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          Experience the first study tool that actually understands what you're trying to do.
        </p>
        <div className="mt-10">
          <a href="/login">
            <Button size="lg" className="bg-primary px-10 py-6 text-lg text-primary-foreground hover:bg-primary/90">
              Start Learning Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
