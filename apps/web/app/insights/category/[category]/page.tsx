import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RetireReadyMnLayout } from "../../../_components/RetireReadyMnPages";
import { categoryToSlug, getInsightPosts, insightCategories } from "../../../_lib/retire-ready-insights";
import { getCurrentTenant } from "../../../_lib/tenant";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return insightCategories.map((category) => ({ category: categoryToSlug(category) }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = insightCategories.find((item) => categoryToSlug(item) === category);
  return {
    title: label ? `${label} | RetireReadyMN` : "RetireReadyMN Insights",
    description: label ? `Minnesota retirement education articles about ${label}.` : undefined
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const tenant = await getCurrentTenant();
  if (tenant.identity.slug !== "retire-ready-mn") {
    redirect("/");
  }

  const { category } = await params;
  const label = insightCategories.find((item) => categoryToSlug(item) === category);
  if (!label) {
    notFound();
  }

  const posts = (await getInsightPosts()).filter((post) => post.category === label);

  return (
    <RetireReadyMnLayout tenant={tenant}>
      <main className="rrmn-insights-page">
        <section className="rrmn-insights-hero">
          <h1>{label}</h1>
          <p>Minnesota-specific retirement income education from RetireReadyMN.</p>
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
