import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { PitchDemo } from "./_components/PitchDemo";
import { WaitlistForm } from "./_components/WaitlistForm";

const differenceCards = [
  {
    title: "Call it",
    body: "During the game, send a clean one-way pitch call from the coach phone to the catcher screen."
  },
  {
    title: "Chart it",
    body: "Automatically keep the current-game call log as your staff works through hitters."
  },
  {
    title: "Scout it",
    body: "Before the next game, the same calls and charting become the opponent database."
  }
];

const pricing = [
  {
    title: "Free",
    price: "$0",
    suffix: "",
    features: ["Button calling", "Current-game log", "1 caller", "No trial clock"]
  },
  {
    title: "Pro",
    price: "$99",
    suffix: "/season",
    features: ["Voice to catcher", "Season history & tendencies", "Unlimited coach seats", "Wristband card generator"]
  },
  {
    title: "Game Day Suite",
    price: "$179",
    suffix: "/season",
    badge: "MOST COACHES",
    featured: true,
    features: [
      "Everything in Pro",
      "Diamond Scout included",
      "At-bat charting + spray charts",
      "Printable opponent scouting reports",
      "Calls feed scouting data"
    ]
  },
  {
    title: "Program",
    price: "$499",
    suffix: "/season",
    features: ["Up to 5 teams", "Shared opponent database", "Program admin"]
  }
];

export default function HomePage() {
  return (
    <div className="site-shell">
      <Header />

      <main>
        <section className="section hero">
          <div className="hero-copy">
            <p className="eyebrow">DugoutCall + Diamond Scout · Built by a coach in Minnesota</p>
            <h1>
              Call the pitch.
              <br />
              <span>Keep the intelligence.</span>
            </h1>
            <p className="lede">
              Free, NFHS-legal button pitch calling from your phone to your catcher. No hardware. No per-user fees. And the part nobody else does: every batter steps in with a scouting card already loaded — and every call you make builds your opponent database.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#waitlist">
                Get early access
              </a>
              <span className="green-tag">Pitch calling is free, all season</span>
            </div>
          </div>

          <PitchDemo />
        </section>

        <section className="section-band alt">
          <div className="section">
            <div className="section-heading">
              <h2>Headset apps forget every pitch. We don't.</h2>
            </div>
            <div className="three-grid">
              {differenceCards.map((card) => (
                <article className="info-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band">
          <div className="section">
            <div className="section-heading">
              <h2>Stop paying more for less memory.</h2>
            </div>
            <div className="comparison-grid">
              <article className="compare-card">
                <h3>What teams pay now (per-user comms apps)</h3>
                <p className="price">$120–160<span>/season</span></p>
                <p>$20/user/month 2-user minimum, pay more to add coaches, license juggling, zero data kept.</p>
              </article>
              <article className="compare-card emphasis">
                <h3>DugoutCall + Diamond Scout</h3>
                <p className="price">$0–179<span>/season</span></p>
                <p>Free button calling, flat team price whole staff included, voice + season history from $99, full scouting reports $179.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section-band alt">
          <div className="section">
            <div className="section-heading">
              <h2>Start free. Upgrade when the data matters.</h2>
            </div>
            <div className="pricing-grid">
              {pricing.map((tier) => (
                <article className={tier.featured ? "price-card featured" : "price-card"} key={tier.title}>
                  <div className="card-topline">
                    <h3>{tier.title}</h3>
                    {tier.badge ? <span className="badge">{tier.badge}</span> : null}
                  </div>
                  <p className="price">
                    {tier.price}
                    {tier.suffix ? <span>{tier.suffix}</span> : null}
                  </p>
                  <ul>
                    {tier.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band" id="waitlist">
          <div className="section">
            <div className="waitlist-card">
              <div className="waitlist-layout">
                <div className="waitlist-copy">
                  <p className="eyebrow">Early access · Spring & summer 2026 testing</p>
                  <h2>Get on the lineup card</h2>
                  <p>
                    We're testing with a small group of Minnesota coaches before opening the season. Early teams lock launch pricing for life.
                  </p>
                </div>
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
