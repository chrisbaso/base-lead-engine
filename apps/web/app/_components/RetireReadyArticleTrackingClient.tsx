"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { InsightPost } from "../_lib/retire-ready-insights";
import { recordRetireReadyContentEventAction } from "../actions";

type ArticleTrackingProps = {
  post: Pick<InsightPost, "slug" | "category" | "ctaVariant" | "title">;
};

export function RetireReadyArticleTrackingClient({ post }: ArticleTrackingProps) {
  useEffect(() => {
    const sessionKey = `rrmn:article-viewed:${post.slug}`;
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, "1");
    void recordRetireReadyContentEventAction({
      eventType: "article_viewed",
      articleSlug: post.slug,
      articleCategory: post.category,
      ctaVariant: post.ctaVariant,
      metadata: { url: window.location.href, title: post.title }
    });
  }, [post.category, post.ctaVariant, post.slug, post.title]);

  const href = `/checkup?article_slug=${encodeURIComponent(post.slug)}&article_category=${encodeURIComponent(
    post.category
  )}&cta_variant=${encodeURIComponent(post.ctaVariant)}`;

  return (
    <aside className="rrmn-article-cta">
      <div>
        <span>Educational next step</span>
        <h2>See your retirement income score in two minutes.</h2>
        <p>Private, Minnesota-focused, and built to show the income gap before any product conversation.</p>
      </div>
      <Link
        className="rrmn-primary-button"
        href={href}
        onClick={() => {
          void recordRetireReadyContentEventAction({
            eventType: "cta_clicked",
            articleSlug: post.slug,
            articleCategory: post.category,
            ctaVariant: post.ctaVariant,
            metadata: { url: window.location.href, title: post.title }
          });
        }}
      >
        Get Your Retirement Income Score
        <ArrowRight aria-hidden="true" />
      </Link>
    </aside>
  );
}
