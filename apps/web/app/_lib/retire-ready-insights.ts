import fs from "node:fs/promises";
import path from "node:path";

export type InsightPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "published";
  publishedAt: string;
  updatedAt: string;
  authorType: string;
  reviewedBy: string;
  complianceStatus: "pending" | "approved" | "changes_requested";
  sourceLinks: string[];
  ctaVariant: string;
  readingMinutes: number;
  body: string;
};

export const insightCategories = [
  "Social Security",
  "Retirement Income Planning",
  "Minnesota Taxes",
  "Market Risk",
  "Annuities Explained",
  "Healthcare Costs"
] as const;

const contentDir = path.join(process.cwd(), "content", "retire-ready-mn", "insights");

export async function getInsightPosts({ includeDrafts = false } = {}): Promise<InsightPost[]> {
  const files = await fs.readdir(contentDir);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => parsePost(file, await fs.readFile(path.join(contentDir, file), "utf8")))
  );

  return posts
    .filter((post) => includeDrafts || post.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getInsightPost(slug: string): Promise<InsightPost | null> {
  const posts = await getInsightPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function categoryToSlug(category: string): string {
  return category.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function renderMarkdown(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith("## ")) {
        return `<h2>${escapeHtml(block.slice(3))}</h2>`;
      }

      if (block.startsWith("- ")) {
        const items = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "))
          .map((line) => `<li>${escapeHtml(line.slice(2))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${escapeHtml(block).replaceAll("\n", "<br />")}</p>`;
    })
    .join("");
}

function parsePost(file: string, raw: string): InsightPost {
  const match = /^---\n(?<frontmatter>[\s\S]*?)\n---\n(?<body>[\s\S]*)$/u.exec(raw);
  if (!match?.groups) {
    throw new Error(`Insight post is missing frontmatter: ${file}`);
  }

  const frontmatterText = match.groups.frontmatter;
  const bodyText = match.groups.body;
  if (!frontmatterText || !bodyText) {
    throw new Error(`Insight post is missing frontmatter or body: ${file}`);
  }

  const frontmatter = parseFrontmatter(frontmatterText);
  const body = bodyText.trim();
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const slug = required(frontmatter.slug, file, "slug");
  const status = frontmatter.status === "draft" ? "draft" : "published";
  const complianceStatus = parseComplianceStatus(frontmatter.compliance_status);

  return {
    slug,
    title: required(frontmatter.title, file, "title"),
    description: required(frontmatter.description, file, "description"),
    category: required(frontmatter.category, file, "category"),
    status,
    publishedAt: required(frontmatter.published_at, file, "published_at"),
    updatedAt: required(frontmatter.updated_at, file, "updated_at"),
    authorType: required(frontmatter.author_type, file, "author_type"),
    reviewedBy: required(frontmatter.reviewed_by, file, "reviewed_by"),
    complianceStatus,
    sourceLinks: parseSourceLinks(required(frontmatter.source_links, file, "source_links")),
    ctaVariant: required(frontmatter.cta_variant, file, "cta_variant"),
    readingMinutes: Math.max(1, Math.round(wordCount / 220)),
    body
  };
}

function parseFrontmatter(frontmatterText: string): Record<string, string> {
  return Object.fromEntries(
    frontmatterText
      .split("\n")
      .map((line) => {
        const [key, ...value] = line.split(":");
        const trimmedKey = key?.trim();
        if (!trimmedKey) {
          return null;
        }

        return [trimmedKey, value.join(":").trim().replace(/^"|"$/g, "")] as const;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null)
  );
}

function parseComplianceStatus(value: string | undefined): InsightPost["complianceStatus"] {
  if (value === "approved" || value === "changes_requested") {
    return value;
  }

  return "pending";
}

function parseSourceLinks(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function required(value: string | undefined, file: string, key: string): string {
  if (!value) {
    throw new Error(`Insight post ${file} is missing ${key}`);
  }

  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
