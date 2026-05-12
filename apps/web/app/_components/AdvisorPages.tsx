import Link from "next/link";
import { ArrowRight, Calculator, ShieldCheck, TrendingUp } from "lucide-react";
import type { TenantConfig } from "@ble/tenant-schema";
import { AdvisorPortrait } from "./AdvisorPortrait";

type AdvisorPageProps = {
  tenant: TenantConfig;
};

function getIcon(name: string) {
  if (name === "shield-check") {
    return ShieldCheck;
  }

  if (name === "calculator") {
    return Calculator;
  }

  return TrendingUp;
}

function excerpt(paragraphs: string[], limit = 82): string {
  const words = paragraphs.join(" ").split(/\s+/).slice(0, limit);
  return `${words.join(" ")}${words.length >= limit ? "..." : ""}`;
}

function heroHeadline(headline: string) {
  const [before, after] = headline.split("actually");

  if (after === undefined) {
    return headline;
  }

  return (
    <>
      {before}
      <span>actually</span>
      {after}
    </>
  );
}

function proofItems(tenant: TenantConfig): Array<{ label: string; value: string }> {
  const proof = tenant.content?.socialProof;

  return [
    { label: "Clients served", value: proof?.clientsServed ?? "Families served" },
    { label: "In practice", value: proof?.yearsInPractice ?? "Years in practice" },
    { label: "Licensed reach", value: proof?.statesLicensedCount ?? "States licensed" }
  ];
}

export function AdvisorHome({ tenant }: AdvisorPageProps) {
  const content = tenant.content;
  const compliance = tenant.compliance;

  if (!content || !compliance) {
    return null;
  }

  const insights = content.insights ?? [];

  return (
    <main>
      <section className="site-hero editorial-hero">
        <div className="hero-copy">
          <h1>{heroHeadline(content.hero.headline)}</h1>
          <p>{content.hero.subheadline}</p>
          <div className="hero-actions">
            <Link className="primary-button large" href="/calculator">
              {content.hero.ctaLabel}
              <ArrowRight aria-hidden="true" />
            </Link>
            <a className="text-link" href="#sample-plan">
              See sample plan
            </a>
          </div>
        </div>
        <div className="hero-portrait-wrap">
          <div className="portrait-offset" aria-hidden="true" />
          <AdvisorPortrait
            advisorName={compliance.advisorName}
            advisorTitle={compliance.advisorTitle}
            photoUrl={content.about.photoUrl}
            credentials={content.about.credentials}
            className="hero-portrait"
            showMeta
          />
        </div>
      </section>

      <section className="stat-band">
        <div className="stat-grid">
          {proofItems(tenant).map((item) => (
            <div className="stat-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-band editorial-services">
        <div className="section-heading">
          <h2>What we do</h2>
          <p>Planning for retirement income, product fit, and tax coordination in one conversation.</p>
        </div>
        <div className="service-grid editorial-card-grid">
          {content.services.items.slice(0, 3).map((service) => {
            const Icon = getIcon(service.icon);
            return (
              <article className="editorial-service-card" key={service.title}>
                <span className="service-icon-box">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <Link className="text-link" href="/services">
                  Learn more <ArrowRight aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-editorial">
        <div>
          <h2>About {compliance.firmName}</h2>
          <p>{excerpt(content.about.firmStoryParagraphs)}</p>
          <div className="credential-list">
            {content.about.credentials.map((credential) => (
              <span key={credential}>{credential}</span>
            ))}
          </div>
          <Link className="text-link" href="/about">
            Read full story <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <AdvisorPortrait
          advisorName={compliance.advisorName}
          advisorTitle={compliance.advisorTitle}
          photoUrl={content.about.photoUrl}
          credentials={content.about.credentials}
          className="about-portrait"
          showMeta
        />
      </section>

      <section className="calculator-promo" id="sample-plan">
        <div>
          <h2>See your retirement paycheck in 30 seconds</h2>
          <p>
            Enter four numbers and see a monthly income range built around your target retirement age,
            savings, and state.
          </p>
          <Link className="primary-button large" href="/calculator">
            Run my numbers
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="calculator-mockup" aria-label="Sample calculator input panel">
          <label>
            <span>Current age</span>
            <input value="60" readOnly tabIndex={-1} />
          </label>
          <label>
            <span>Retirement savings</span>
            <input value="$750,000" readOnly tabIndex={-1} />
          </label>
          <div className="mock-slider">
            <span />
          </div>
          <strong>$3,625 - $4,125 / month</strong>
        </div>
      </section>

      <section className="insights-section">
        <div className="section-heading">
          <h2>Insights</h2>
          <p>Planning notes for the decisions that shape a retirement paycheck.</p>
        </div>
        {insights.length > 0 ? (
          <div className="insight-grid">
            {insights.slice(0, 3).map((insight) => (
              <article className="insight-card" key={insight.headline}>
                <span>{insight.category}</span>
                <h3>{insight.headline}</h3>
                <p>{insight.excerpt}</p>
                <time>{insight.date}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="insights-empty">
            <p>Insights coming soon.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export function AdvisorAbout({ tenant }: AdvisorPageProps) {
  const content = tenant.content;
  const compliance = tenant.compliance;

  if (!content || !compliance) {
    return null;
  }

  return (
    <main className="site-page about-page">
      <section className="page-hero about-hero">
        <div>
          <h1>{compliance.advisorName}</h1>
          <p className="advisor-title">{compliance.advisorTitle}</p>
          <div className="credential-list">
            {content.about.credentials.map((credential) => (
              <span key={credential}>{credential}</span>
            ))}
          </div>
        </div>
        <AdvisorPortrait
          advisorName={compliance.advisorName}
          advisorTitle={compliance.advisorTitle}
          photoUrl={content.about.photoUrl}
          credentials={content.about.credentials}
          className="about-portrait"
        />
      </section>

      <section className="editorial-prose">
        <h2>Retirement income is a different problem than retirement saving.</h2>
        {content.about.firmStoryParagraphs.map((paragraph, index) => (
          <p key={paragraph} className={index === 1 ? "after-quote" : undefined}>
            {paragraph}
          </p>
        ))}
        <blockquote>The number stops being the goal. The income that number can produce becomes the goal.</blockquote>
        {content.about.advisorBioParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="credential-section">
        <h2>Credentials and Focus</h2>
        <div className="credential-card-grid">
          {content.about.credentials.map((credential) => (
            <article key={credential}>
              <h3>{credential}</h3>
              <p>Applied in retirement income conversations, product review, and coordinated planning.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>Schedule a call</h2>
        <Link className="primary-button large" href="/schedule">
          Choose a time
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

export function AdvisorServices({ tenant }: AdvisorPageProps) {
  const content = tenant.content;

  if (!content) {
    return null;
  }

  return (
    <main className="site-page services-page">
      <section className="page-hero">
        <h1>Services</h1>
        <p>Retirement planning built around income, taxes, and product fit.</p>
      </section>
      <section className="service-bands">
        {content.services.items.map((service, index) => {
          const Icon = getIcon(service.icon);
          const number = String(index + 1).padStart(2, "0");
          return (
            <article className="service-band-item" key={service.title}>
              <div className="service-band-icon">
                <span>{number}</span>
                <Icon aria-hidden="true" />
              </div>
              <div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <div className="practice-list">
                  <h3>What this looks like in practice</h3>
                  <ul>
                    <li>Clarify the role this decision plays in your retirement income plan.</li>
                    <li>Compare the math against realistic alternatives before taking action.</li>
                    <li>Coordinate timing, taxes, and risk so the recommendation has context.</li>
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      <section className="final-cta">
        <h2>See if a plan makes sense for you</h2>
        <Link className="primary-button large" href="/calculator">
          Run my numbers
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

export function AdvisorDisclosures({ tenant }: AdvisorPageProps) {
  const compliance = tenant.compliance;

  if (!compliance) {
    return null;
  }

  return (
    <main className="site-page disclosures-page">
      <section className="disclosure-prose">
        <h1>Disclosures</h1>
        <p>
          <strong>{compliance.firmName}</strong>
        </p>
        <p>
          CRD# <code>{compliance.crdNumber}</code>
        </p>
        <p>
          View advisor background at{" "}
          <a href={compliance.brokerCheckUrl} rel="noreferrer" target="_blank">
            FINRA BrokerCheck
          </a>.
        </p>
        <p>
          Form ADV Part 2A is available at{" "}
          <a href={compliance.adv2Url} rel="noreferrer" target="_blank">
            the Form ADV link
          </a>.
        </p>
        <p>
          Privacy policy:{" "}
          <a href={compliance.privacyPolicyUrl} rel="noreferrer" target="_blank">
            {compliance.privacyPolicyUrl}
          </a>
        </p>
        <p>
          States licensed: <code>{compliance.statesLicensed.join(", ")}</code>
        </p>
        {compliance.disclosureFooter.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </main>
  );
}

export function AdvisorSchedule({ tenant }: AdvisorPageProps) {
  const content = tenant.content;

  if (!content) {
    return null;
  }

  return (
    <main className="site-page">
      <section className="page-hero">
        <h1>Schedule</h1>
        <p>Choose a time for a short retirement income conversation.</p>
      </section>
      <section className="schedule-frame">
        {content.schedulingUrl ? (
          <iframe src={content.schedulingUrl} title="Schedule a call" />
        ) : (
          <p>Scheduling is not configured yet.</p>
        )}
      </section>
    </main>
  );
}
