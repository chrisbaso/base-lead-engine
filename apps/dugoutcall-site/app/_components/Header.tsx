import { Brand } from "./Brand";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <a className="pill-button" href="/#waitlist">
          Get early access
        </a>
      </div>
    </header>
  );
}
