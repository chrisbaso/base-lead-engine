import type { Metadata } from "next";
import { Brand } from "../_components/Brand";
import { Footer } from "../_components/Footer";

export const metadata: Metadata = {
  title: "Terms | DugoutCall",
  description: "Plain-language beta terms for DugoutCall."
};

export default function TermsPage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <a className="pill-button" href="/#waitlist">
            Get early access
          </a>
        </div>
      </header>

      <main className="legal-main">
        <article className="section legal-card">
          <a className="legal-back" href="/">
            Back to DugoutCall
          </a>
          <div>
            <p className="eyebrow">Effective date: June 13, 2026</p>
            <h1>Terms</h1>
          </div>

          <section>
            <h2>Beta software</h2>
            <p>
              DugoutCall is beta software. It is provided as-is and may change, break, or be unavailable while we test and improve it.
            </p>
          </section>

          <section>
            <h2>No warranty</h2>
            <p>
              We do not provide warranties of any kind. DugoutCall is not a certified officiating, safety, or legal compliance product.
            </p>
          </section>

          <section>
            <h2>Rules and compliance</h2>
            <p>
              You are responsible for verifying that electronic coach-to-catcher communication is allowed by your league, tournament, school, conference, and state association before using DugoutCall in a game.
            </p>
          </section>

          <section>
            <h2>Acceptable use</h2>
            <p>
              Do not use DugoutCall to harass, abuse, interfere with other teams, break competition rules, compromise accounts, scrape systems, or attempt to disrupt the service.
            </p>
          </section>

          <section>
            <h2>Pricing</h2>
            <p>
              Waitlist, beta, and launch pricing may change before public release. Early access does not guarantee a specific feature set, timeline, or commercial availability.
            </p>
          </section>

          <section>
            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of Minnesota, without regard to conflict-of-law rules.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
