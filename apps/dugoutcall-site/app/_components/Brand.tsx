import Link from "next/link";

export function Brand() {
  return (
    <Link className="wordmark" href="/" aria-label="DugoutCall home">
      <span>Dugout</span>
      <span className="wordmark-call">
        Call<span className="wordmark-dot">.</span>
      </span>
    </Link>
  );
}
