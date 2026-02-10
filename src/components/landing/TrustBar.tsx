const TrustBar = () => {
  return (
    <section className="border-y border-border bg-muted/50 px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
        <span className="text-sm text-muted-foreground">Powered by</span>
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
          </svg>
          <span className="font-heading text-lg font-bold text-foreground">Gemini</span>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
