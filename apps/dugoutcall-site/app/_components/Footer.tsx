import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section footer-inner">
        <div>
          <p>DugoutCall + Diamond Scout · Built in Waconia, MN · NFHS one-way comms compliant*</p>
          <p>*Electronic coach-to-catcher communication approved by NFHS (2023). Verify your state association's current rules.</p>
        </div>
        <nav className="footer-links" aria-label="Legal links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
