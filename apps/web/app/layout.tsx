import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { headers } from "next/headers";
import { Fraunces, Inter_Tight } from "next/font/google";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Lead Engine",
  description: "Reusable lead generation funnel chassis"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "optional",
  axes: ["opsz"]
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "optional"
});

function getBrandForeground(hexColor: string): string {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 150 ? "#061015" : "#ffffff";
}

function hexToRgb(hexColor: string): { red: number; green: number; blue: number } {
  return {
    red: Number.parseInt(hexColor.slice(1, 3), 16),
    green: Number.parseInt(hexColor.slice(3, 5), 16),
    blue: Number.parseInt(hexColor.slice(5, 7), 16)
  };
}

function mixHex(foreground: string, background: string, foregroundWeight: number): string {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const weight = foregroundWeight;
  const red = Math.round(fg.red * weight + bg.red * (1 - weight));
  const green = Math.round(fg.green * weight + bg.green * (1 - weight));
  const blue = Math.round(fg.blue * weight + bg.blue * (1 - weight));

  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const slug = process.env.TENANT_SLUG ?? resolveTenantSlug(host);
  const tenant = getTenantConfig(slug);
  const colorPaper = "#fafaf7";
  const colorInk = "#0f172a";
  const themeStyle: CSSProperties & Record<string, string> = {
    "--primary": tenant.branding.primaryColor,
    "--accent": tenant.branding.accentColor,
    "--brand-foreground": getBrandForeground(tenant.branding.primaryColor),
    "--color-ink": colorInk,
    "--color-ink-muted": "rgba(15, 23, 42, 0.62)",
    "--color-paper": colorPaper,
    "--color-surface": "#f3f1ea",
    "--color-rule": "#e5e3da",
    "--color-brand": tenant.branding.primaryColor,
    "--color-brand-soft": mixHex(tenant.branding.primaryColor, colorPaper, 0.12),
    "--color-accent": tenant.branding.accentColor
  };

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable}`}
      data-theme={tenant.identity.slug}
      style={themeStyle}
    >
      <body>{children}</body>
    </html>
  );
}
