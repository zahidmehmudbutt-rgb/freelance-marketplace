import Link from "next/link";
import { Search, MessageCircle, ShieldCheck, CheckCircle2, Star, Wallet } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "How it works — Brellis",
  description: "From finding the right freelancer to releasing payment — see exactly how Brellis works for buyers and sellers.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-line bg-canvas">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-dark mb-3">How it works</p>
            <h1 className="font-heading text-3xl sm:text-5xl text-ink text-balance leading-tight mb-4">
              Hire confidently. Get paid securely.
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed text-balance">
              Whether you&apos;re buying a service or selling one, Brellis is built around a simple promise:
              clear pricing, escrowed payments, and verified reviews.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-heading text-2xl sm:text-3xl text-ink text-center mb-2">For buyers</h2>
            <p className="text-sm text-ink-subtle text-center mb-10">Four steps from idea to delivered work.</p>
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Step n={1} icon={<Search className="w-5 h-5" />} title="Find a service" body="Browse categories or search by keyword. Every gig shows a fixed starting price, delivery time, and reviews up front." />
              <Step n={2} icon={<MessageCircle className="w-5 h-5" />} title="Message or order" body="Ask the seller a question, request a custom offer, or order a package directly. No back-and-forth required to get a quote." />
              <Step n={3} icon={<ShieldCheck className="w-5 h-5" />} title="Pay into escrow" body="Your payment is held safely by Brellis — the seller is only paid when you approve the delivery." />
              <Step n={4} icon={<CheckCircle2 className="w-5 h-5" />} title="Review and release" body="Approve the work or request a revision. Once you approve, funds release automatically and you can leave a review." />
            </ol>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-b border-line bg-canvas-subtle">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-heading text-2xl sm:text-3xl text-ink text-center mb-2">For sellers</h2>
            <p className="text-sm text-ink-subtle text-center mb-10">Build a profile, publish gigs, get paid.</p>
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Step n={1} icon={<Star className="w-5 h-5" />} title="Create a profile" body="Add your tagline, skills, languages, and a portfolio. Profiles are public — link to them from your own site." />
              <Step n={2} icon={<CheckCircle2 className="w-5 h-5" />} title="Publish a gig" body="Define three package tiers (Basic / Standard / Premium), delivery times, and revision policy. Submit for review." />
              <Step n={3} icon={<MessageCircle className="w-5 h-5" />} title="Deliver the work" body="Communicate inside Brellis so the order timeline, files, and revisions stay in one place." />
              <Step n={4} icon={<Wallet className="w-5 h-5" />} title="Get paid" body="When the buyer approves, your earnings appear in your balance. Withdraw to your bank anytime." />
            </ol>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-b border-line">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-5">
              <Promise title="Escrow protection" body="Funds are held by Brellis until you approve the delivery. Disputed orders go to mediation, never the seller's wallet by default." />
              <Promise title="Transparent fees" body="Buyer service fee is 5.5%, shown before checkout. Seller commission is 20%. No hidden charges, no surprise add-ons." />
              <Promise title="Verified reviews" body="Reviews can only be left by buyers who actually completed an order. No drive-by ratings, no purchased reviews." />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-heading text-2xl sm:text-3xl text-ink mb-4">Ready to start?</h2>
            <p className="text-base text-ink-muted mb-6">
              Browse services or set up your seller profile — both take about a minute.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/search" className="btn-primary">Browse services</Link>
              <Link href="/become-seller" className="btn-secondary">Become a seller</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="bg-white border border-line rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-brand-primary-50 text-brand-primary-dark inline-flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">Step {n}</span>
      </div>
      <h3 className="font-heading text-base text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
    </li>
  );
}

function Promise({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-line rounded-2xl p-5 bg-white">
      <h3 className="font-heading text-base text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}
