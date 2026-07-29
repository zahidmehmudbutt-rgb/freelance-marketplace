import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-canvas-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <Col title="Platform">
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
          <FooterLink href="/careers">Careers</FooterLink>
          <FooterLink href="/press">Press</FooterLink>
        </Col>
        <Col title="Categories">
          <FooterLink href="/category/web-development">Web development</FooterLink>
          <FooterLink href="/category/mobile-development">Mobile development</FooterLink>
          <FooterLink href="/category/design-creative">Design &amp; creative</FooterLink>
          <FooterLink href="/category/ai-automation">AI &amp; automation</FooterLink>
        </Col>
        <Col title="Support">
          <FooterLink href="/help">Help center</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
        </Col>
        <Col title="Legal">
          <FooterLink href="/privacy">Privacy policy</FooterLink>
          <FooterLink href="/terms">Terms of service</FooterLink>
          <FooterLink href="/cookies">Cookie policy</FooterLink>
        </Col>
      </div>
      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-3 flex-wrap text-xs text-ink-subtle">
          <p>© {new Date().getFullYear()} Brellis. All rights reserved.</p>
          <Link href="/" className="text-base font-semibold text-brand-primary tracking-tight">
            Brellis
          </Link>
        </div>
      </div>
    </footer>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle mb-3">{title}</h4>
      <div className="space-y-2 text-ink-muted">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block hover:text-brand-primary-dark transition-colors">
      {children}
    </Link>
  );
}
