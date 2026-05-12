import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";
import type { TenantConfig } from "@ble/tenant-schema";
import { retireReadyMnCopy } from "@ble/tenant-retire-ready-mn/copy";
import { TrackingScripts } from "../tracking-scripts";
import { RetireReadyMnCheckupClient } from "./RetireReadyMnCheckupClient";

type RetireReadyMnLayoutProps = {
  tenant: TenantConfig;
  children: ReactNode;
};

type RetireReadyMnHomeProps = {
  tenant: TenantConfig;
  heroVariantId?: string | undefined;
  quizFrameId?: string | undefined;
};

type RetireReadyMnCheckupProps = {
  tenant: TenantConfig;
  heroVariantId?: string | undefined;
  quizFrameId?: string | undefined;
};

const navItems = [
  { href: "/checkup", label: "Checkup" },
  { href: "/insights", label: "Insights" }
] as const;

function resolveHeroVariant(heroVariantId?: string | undefined) {
  return (
    retireReadyMnCopy.heroVariants.find((variant) => variant.id === heroVariantId) ??
    retireReadyMnCopy.heroVariants[0]
  );
}

function resolveQuizFrame(quizFrameId?: string | undefined) {
  return retireReadyMnCopy.quizFrames.find((frame) => frame.id === quizFrameId) ?? retireReadyMnCopy.quizFrames[0];
}

function buildCheckupHref(heroVariantId?: string | undefined, quizFrameId?: string | undefined) {
  const params = new URLSearchParams();
  if (heroVariantId) {
    params.set("hero_variant", heroVariantId);
  }
  if (quizFrameId) {
    params.set("quiz_frame", quizFrameId);
  }
  const query = params.toString();
  return query ? `/checkup?${query}` : "/checkup";
}

export function RetireReadyMnLayout({ tenant, children }: RetireReadyMnLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <div className="rrmn-site">
      <TrackingScripts tenant={tenant} />
      <header className="rrmn-header">
        <Link className="rrmn-wordmark" href="/">
          <span aria-hidden="true">RR</span>
          <strong>RetireReadyMN</strong>
        </Link>
        <nav aria-label="RetireReadyMN navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className="rrmn-footer">
        <div>
          <strong>RetireReadyMN</strong>
          <p>{retireReadyMnCopy.identity.tagline}</p>
        </div>
        <p>{retireReadyMnCopy.footerDisclosure}</p>
        <span>Copyright {year} RetireReadyMN</span>
      </footer>
    </div>
  );
}

export function RetireReadyMnHome({ tenant, heroVariantId, quizFrameId }: RetireReadyMnHomeProps) {
  const hero = resolveHeroVariant(heroVariantId);
  const quizFrame = resolveQuizFrame(quizFrameId);
  const checkupHref = buildCheckupHref(hero.id, quizFrame.id);

  return (
    <RetireReadyMnLayout tenant={tenant}>
      <main className="rrmn-home">
        <section className="rrmn-hero">
          <div className="rrmn-hero-copy">
            <h1>{hero.headline}</h1>
            <p>{hero.subheadline}</p>
            <div className="rrmn-actions">
              <Link className="rrmn-primary-button" href={checkupHref}>
                {retireReadyMnCopy.identity.cta}
                <ArrowRight aria-hidden="true" />
              </Link>
              <span>
                <LockKeyhole aria-hidden="true" />
                No public advisor branding. Private educational checkup.
              </span>
            </div>
          </div>
          <div className="rrmn-visual" aria-label="Minnesota lake and score preview">
            <div className="rrmn-lake-scene">
              <div className="rrmn-sun" />
              <div className="rrmn-tree-line" />
              <div className="rrmn-lake-lines" />
            </div>
            <div className="rrmn-score-preview">
              <span>{quizFrame.label}</span>
              <strong>Income Score</strong>
              <div>
                <BarChart3 aria-hidden="true" />
                <p>Portfolio income + Social Security vs. desired income</p>
              </div>
            </div>
          </div>
        </section>
        <section className="rrmn-proof-band">
          {[
            ["2 minutes", "Seven focused questions"],
            ["Minnesota only", "Local tax and advisor handoff context"],
            ["Educational", "No product recommendations or return guarantees"]
          ].map(([value, label]) => (
            <article key={value}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </section>
        <section className="rrmn-process">
          <div>
            <h2>A retirement income checkup, not a sales page.</h2>
            <p>
              The score compares a 4% portfolio income baseline and your Social Security estimate against the
              monthly income you want. It highlights the gap before anyone talks about products.
            </p>
          </div>
          <div className="rrmn-process-list">
            {[
              ["Estimate", "Answer age, savings, Social Security, and desired income questions."],
              ["Score", "See Red, Yellow, or Green with a plain-English income summary."],
              ["Match", "Choose whether to share a phone number for a local Minnesota specialist handoff."]
            ].map(([title, body]) => (
              <article key={title}>
                <MapPin aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </RetireReadyMnLayout>
  );
}

export function RetireReadyMnCheckup({ tenant, heroVariantId, quizFrameId }: RetireReadyMnCheckupProps) {
  return (
    <RetireReadyMnLayout tenant={tenant}>
      <main className="rrmn-checkup-page">
        <section className="rrmn-checkup-shell">
          <div className="rrmn-checkup-intro">
            <ShieldCheck aria-hidden="true" />
            <h1>{resolveQuizFrame(quizFrameId).label}</h1>
            <p>{retireReadyMnCopy.identity.tagline}</p>
          </div>
          <RetireReadyMnCheckupClient
            tenant={tenant}
            heroVariantId={resolveHeroVariant(heroVariantId).id}
            quizFrameId={resolveQuizFrame(quizFrameId).id}
          />
        </section>
      </main>
    </RetireReadyMnLayout>
  );
}
