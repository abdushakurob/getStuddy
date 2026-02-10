const footerLinks = [
  { label: "Manifesto", href: "#" },
  { label: "Agent Logic", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Contact", href: "#" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">© 2026 goStuddy</p>
      </div>
    </footer>
  );
};

export default Footer;
