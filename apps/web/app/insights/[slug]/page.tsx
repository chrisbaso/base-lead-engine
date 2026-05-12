import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RetireReadyArticleTrackingClient } from "../../_components/RetireReadyArticleTrackingClient";
import { RetireReadyMnLayout } from "../../_components/RetireReadyMnPages";
import { getInsightPost, getInsightPosts, renderMarkdown } from "../../_lib/retire-ready-insights";
import { getCurrentTenant } from "../../_lib/tenant";

type InsightPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getInsightPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getInsightPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | RetireReadyMN`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt
    }
  };
}

export default async function InsightPage({ params }: InsightPageProps) {
  const tenant = await getCurrentTenant();
  if (tenant.identity.slug !== "retire-ready-mn") {
    redirect("/");
  }

  const { slug } = await params;
  const post = await getInsightPost(slug);
  if (!post) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "RetireReadyMN"
    },
    publisher: {
      "@type": "Organization",
      name: "RetireReadyMN"
    }
  };

  return (
    <RetireReadyMnLayout tenant={tenant}>
      <main className="rrmn-article-page">
        <article>
          <header>
            <span>{post.category}</span>
            <h1>{post.title}</h1>
            <p>{post.description}</p>
            <time>{post.publishedAt}</time>
          </header>
          <div className="rrmn-article-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
          <section className="rrmn-article-sources" aria-label="Sources">
            <h2>Sources</h2>
            <ul>
              {post.sourceLinks.map((source) => (
                <li key={source}>
                  <a href={source}>{source}</a>
                </li>
              ))}
            </ul>
          </section>
          <RetireReadyArticleTrackingClient post={post} />
        </article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </main>
    </RetireReadyMnLayout>
  );
}
