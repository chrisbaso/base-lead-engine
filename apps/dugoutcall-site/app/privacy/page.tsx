import type { Metadata } from "next";
import { Brand } from "../_components/Brand";
import { Footer } from "../_components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | DugoutCall",
  description: "DugoutCall privacy policy for waitlist and TestFlight users."
};

export default function PrivacyPage() {
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
            <h1>Privacy Policy</h1>
          </div>

          <section>
            <h2>What we collect</h2>
            <p>
              DugoutCall collects the coach name and email address you provide at signup, waitlist form details such as role and current pitch-calling system, and product usage data tied to a team account, including pitch-call and charting events.
            </p>
          </section>

          <section>
            <h2>Device and log data</h2>
            <p>
              We may collect basic device, browser, diagnostic, and server log data to keep the service reliable, troubleshoot bugs, prevent abuse, and understand whether the app is working during beta testing.
            </p>
          </section>

          <section>
            <h2>Catchers, players, and minors</h2>
            <p>
              Catchers and players do not create DugoutCall accounts. Receiver devices pair anonymously for game use. We do not knowingly collect personal information from minors. If you believe a minor's personal information was provided to us, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2>Where data is stored</h2>
            <p>
              Data is stored with infrastructure providers that help us run the service, including Supabase for database services and Vercel for web hosting. These providers process data for us so the product can operate.
            </p>
          </section>

          <section>
            <h2>How we use data</h2>
            <ul>
              <li>To operate the waitlist and contact coaches when access opens.</li>
              <li>To provide pitch-calling, charting, and scouting workflows to team accounts.</li>
              <li>To improve reliability, safety, and product quality during beta testing.</li>
              <li>To respond to privacy, support, or deletion requests.</li>
            </ul>
          </section>

          <section>
            <h2>No sale of personal data</h2>
            <p>
              We do not sell personal data. We do not share waitlist information with advertisers or data brokers.
            </p>
          </section>

          <section>
            <h2>Deletion and privacy requests</h2>
            <p>
              You can request deletion of your waitlist record or team account data by emailing privacy@dugoutcall.com. We will delete the information we reasonably can unless we need to keep limited records for security, legal, or operational reasons.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
