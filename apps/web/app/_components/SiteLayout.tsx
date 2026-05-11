import Link from "next/link";
import type { ReactNode } from "react";
import type { TenantConfig } from "@ble/tenant-schema";
import { TrackingScripts } from "../tracking-scripts";
import { Wordmark } from "./Wordmark";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/calculator", label: "Calculator" },
  { href: "/schedule", label: "Schedule" }
] as const;

type SiteLayoutProps = {
  tenant: TenantConfig;
  children: ReactNode;
};

function splitParagraphs(text: string): string[] {
  return text.split("\n\n").filter(Boolean);
}

export function SiteLayout({ tenant, children }: SiteLayoutProps) {
  const compliance = tenant.compliance;
  const states = compliance?.statesLicensed.join(", ");
  const year = new Date().getFullYear();

  return (
    <div className="advisor-site">
      <TrackingScripts tenant={tenant} />
      <header className="site-header">
        <Link className="site-logo" href="/">
          <Wordmark text={tenant.branding.logoText} />
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <details className="mobile-nav">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark text={tenant.branding.logoText} />
            <p>Retirement income planning for families who want clarity before the paycheck starts.</p>
          </div>
          <div>
            <h2>Navigation</h2>
            <div className="footer-links">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2>Services</h2>
            <div className="footer-links">
              {tenant.content?.services.items.slice(0, 3).map((service) => (
                <Link key={service.title} href="/services">
                  {service.title}
                </Link>
              ))}
            </div>
          </div>
          {compliance ? (
            <div>
              <h2>Legal</h2>
              <div className="footer-links">
                <a href={compliance.brokerCheckUrl} rel="noreferrer" target="_blank">
                  BrokerCheck
                </a>
                <a href={compliance.adv2Url} rel="noreferrer" target="_blank">
                  Form ADV
                </a>
                <a href={compliance.privacyPolicyUrl} rel="noreferrer" target="_blank">
                  Privacy Policy
                </a>
                <Link href="/disclosures">Disclosures</Link>
              </div>
            </div>
          ) : null}
          <div>
            <h2>Contact</h2>
            <p>{compliance?.firmName ?? tenant.identity.name}</p>
            {states ? <p>Licensed states: {states}</p> : null}
            {compliance ? (
              <p>
                CRD#{" "}
                <a href={compliance.brokerCheckUrl} rel="noreferrer" target="_blank">
                  {compliance.crdNumber}
                </a>
              </p>
            ) : null}
          </div>
        </div>
        {compliance ? (
          <div className="footer-disclosure">
            {splitParagraphs(compliance.disclosureFooter).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        <p className="copyright">
          Copyright {year} {compliance?.firmName ?? tenant.identity.name}
          {compliance ? (
            <>
              {" "}
              | CRD#{" "}
              <a href={compliance.brokerCheckUrl} rel="noreferrer" target="_blank">
                {compliance.crdNumber}
              </a>{" "}
              |{" "}
              <a href={compliance.adv2Url} rel="noreferrer" target="_blank">
                Form ADV
              </a>
            </>
          ) : null}
        </p>
      </footer>
    </div>
  );
}
