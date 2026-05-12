import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RetireReadyMnLayout } from "../_components/RetireReadyMnPages";
import { categoryToSlug, getInsightPosts, insightCategories } from "../_lib/retire-ready-insights";
import { getCurrentTenant } from "../_lib/tenant";

export const metadata: Metadata = {
  title: "RetireReadyMN Insights",
  description: "Minnesota-specific retirement income planning articles from RetireReadyMN."
};

export default async function InsightsPage() {
  const tenant = await getCurrentTenant();
  if (tenant.identity.slug !== "retire-ready-mn") {
    redirect("/");
  }

  const posts = await getInsightPosts();

  return (
    <RetireReadyMnLayout tenant={tenant}>
      <main className="rrmn-insights-page">
        <section className="rrmn-insights-hero">
          <h1>Retirement income insights for Minnesotans.</h1>
          <p>Educational articles on Social Security, income planning, taxes, risk, annuities, and healthcare costs.</p>
        </section>
        <section className="rrmn-category-nav" aria-label="Insight categories">
          {insightCategories.map((category) => (
            <Link key={category} href={`/insights/category/${categoryToSlug(category)}`}>
              {category}
            </Link>
          ))}
        </section>
        <section className="rrmn-post-grid">
          {posts.map((post) => (
            <article key={post.slug} className="rrmn-post-card">
              <span>{post.category}</span>
              <h2>
                <Link href={`/insights/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.description}</p>
              <time>{post.publishedAt}</time>
            </article>
          ))}
        </section>
      </main>
    </RetireReadyMnLayout>
  );
}
